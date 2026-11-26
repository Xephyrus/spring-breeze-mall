# 后端代码规范

适用目录：`backend/`（Java 25 + Spring Boot 4 + MyBatis-Plus + Lombok）。

本文件的规则不是凭空写的，而是从「把 1000+ 条编辑器告警清到 0」的过程中沉淀出来的：
每一条背后都有对应的真实坑。新增代码请按此执行，评审时也按此检查。

---

## 1. 格式与编码

| 项 | 约定 | 落地方式 |
|---|---|---|
| 编码 | UTF-8（无 BOM） | `.editorconfig`、Maven `project.build.sourceEncoding` |
| 换行 | LF（`.cmd`/`.bat` 用 CRLF） | `.editorconfig` |
| 缩进 | Java 4 空格、yaml/json/vue 2 空格；**禁止 Tab** | `.editorconfig` |
| 行宽 | 建议 ≤ 140；现有最长 143，不要显著超过 | 评审 |
| 文件结尾 | 恰好一个换行 | `.editorconfig` |
| 行尾空格 | 不允许（Markdown 除外） | `.editorconfig` |

IDE 侧无需额外配置，认 `.editorconfig` 即可。

---

## 2. 导入（import）

1. **禁止通配符导入**：`import java.util.*;` 不接受，写全类名。
2. **禁止未使用的 import**：这是历史包袱最重的一项（一次清掉 223 处）。删除类/方法引用后，务必同步清理 import。
3. 顺序：`cn.lili.*` 自有包 → 第三方包 → `java.*`/`javax.*`，组内按字母序，组间空一行。
4. 不要写 `import java.lang.*`。

自查方式（无需 IDE）：

```bash
mvn -o -q -DskipTests compile
```

未使用 import 在编译期不报错，所以**提交前务必用 IDE 的 "Organize Imports"**（VS Code：`Shift+Alt+O`）。

---

## 3. 命名

| 元素 | 规则 | 反例 |
|---|---|---|
| 类 / 接口 | UpperCamelCase，名词 | `DoSomething` |
| 方法 | lowerCamelCase，动词开头 | `data()`、`process()` |
| 变量 / 参数 | lowerCamelCase，语义完整 | `a`、`tmp`、`list1` |
| 常量 | UPPER_SNAKE_CASE | `maxSize` |
| 包 | 全小写，按 `cn.lili.modules.<域>.<层>` 分层 | `cn.lili.Modules` |
| 布尔 | `is` / `has` / `can` 开头 | `flag`、`status`（易与枚举混淆） |
| DTO/VO/DO | 后缀区分：`XxxDTO`（入参）、`XxxVO`（出参）、`Xxx`（实体） | `XxxBean`、`XxxModel` |

数据库列名与字段名的映射靠 MyBatis-Plus 的驼峰转换，**不要为了迁就列名把字段写成下划线**。

---

## 4. 泛型（本项目最容易踩的区域）

MyBatis-Plus 的 `Wrapper<T>` / `Page<T>` 与 Lombok 一起，是历史上告警的主要来源。四条硬性规则：

### 4.1 声明必须带类型参数

```java
// ❌ 原始类型：一条 raw type + 调用点若干条 unchecked
QueryWrapper wrapper = new QueryWrapper();
wrapper.eq("id", id);

// ✅
QueryWrapper<Order> wrapper = new QueryWrapper<>();
wrapper.eq("id", id);
```

常见遗漏点：**方法返回类型**、**`new Xxx()` 的右侧**（`new QueryWrapper<>()`）。

### 4.2 一个 wrapper 复用到多个实体时，抽泛型 helper

```java
// ❌ 同一个 wrapper 打三张表：泛型不变性下无解，只能原始类型
QueryWrapper queryWrapper = new QueryWrapper();
queryWrapper.in("role_id", roleIds);
storeDepartmentRoleService.count(queryWrapper);   // 要 Wrapper<StoreDepartmentRole>
storeClerkRoleService.count(queryWrapper);        // 要 Wrapper<StoreClerkRole>
storeMenuRoleService.remove(queryWrapper);        // 要 Wrapper<StoreMenuRole>

// ✅ 方案 A：每处内联各自的类型（无 helper 时最直观）
storeDepartmentRoleService.count(new QueryWrapper<StoreDepartmentRole>().in("role_id", roleIds));

// ✅ 方案 B：helper 泛型化，由调用方推断 T（推荐，条件只维护一份）
private <T> QueryWrapper<T> roleIdWrapper(List<String> roleIds) {
    QueryWrapper<T> w = new QueryWrapper<>();
    w.in("role_id", roleIds);
    return w;
}
```

### 4.3 mapper 里只做 SQL 拼接的参数，用通配符

```java
// ✅ 自定义 SQL 方法，Wrapper 只交给 ${ew.customSqlSegment}，类型不参与 Java 逻辑
Integer count(@Param(Constants.WRAPPER) Wrapper<?> queryWrapper);
```

不要写 `Wrapper queryWrapper`（raw），也不需要强行指定实体——通配符同时满足"接收任意 `Wrapper<X>`"和"不是原始类型"。

### 4.4 需要强转时经通配符中转

```java
Cache<Object> cache = ...;
// ❌ 编译不过：同一泛型的不同参数化之间不可直接转换
(Cache<GoodsVO>) cache
// ✅
(Cache<GoodsVO>) (Cache<?>) cache
```

---

## 5. Lombok

1. 实体/DTO/VO 用 `@Data` 即可，**不要手写 getter/setter**；
2. 依赖注入统一 `@RequiredArgsConstructor` + `private final` 字段，新代码不要再写 `@Autowired` 字段注入
   （存量 1509 处字段注入保持原样，改造属于独立任务）；
3. `@Builder` 用于构造参数较多的对象；无参构造缺失时记得 `@NoArgsConstructor`；
4. **Lombok 生成的成员 Eclipse 编译器看不见**，因此 `.settings` 里关闭了 `unusedPrivateMember` 检查，
   详见第 9 节。不要因为"IDE 说字段没用到"就删字段。

---

## 6. 日志与异常

```java
// ✅ 用 @Slf4j 的 log，占位符形式，禁止字符串拼接
log.info("订单 {} 状态变更 {} -> {}", orderSn, from, to);

// ❌
System.out.println("order " + orderSn + " changed");
log.error("失败：" + e.getMessage());

// ✅ 异常要带上下文，且不要吞掉
try {
    doSomething(order);
} catch (Exception e) {
    log.error("处理订单 {} 失败", order.getSn(), e);
    throw new ServiceException(ResultCode.ORDER_UPDATE_ERROR);
}
```

业务异常统一抛 `cn.lili.common.exception.ServiceException` + `ResultCode`，不要抛裸 `RuntimeException`。

---

## 7. 事务

- 写在 service 层，标注 `@Transactional(rollbackFor = Exception.class)`；
- 不要在 `@Transactional` 方法里做远程调用（MQ 发送、HTTP 请求），必要时放到事务提交后；
- 同类内部方法调用不会触发事务代理，需拆到另一个 Bean。

---

## 8. 测试

1. 命名 `被测类名Test`，方法名描述行为：`retryUsesOriginalConfigAndSuccessfulRecordCannotIssueAgain`；
2. 断言统一 AssertJ（`assertThat`）；
3. **Mockito 的 `any(Xxx.class)`、`ArgumentCaptor.forClass(Xxx.class)` 与 MyBatis-Plus 的 `Wrapper<T>`
   在运行时会擦除泛型**，这类 unchecked 告警在测试类上统一用类级抑制，并在类头写两行注释说明：

   ```java
   // Mockito/MyBatis-Plus 的泛型在运行时擦除，这里的 unchecked 告警无法在不改变语义前提下消除。
   @SuppressWarnings("unchecked")
   class XxxTest {
   ```

   只给**真正需要**的类加：先去掉注解跑一次编译，报错/告警的类才加回来。
4. 不要用 `any()` 替换 `any(Xxx.class)` 来消除告警——`insert(T)` / `insert(Collection<T>)`、
   `list()` / `list(Wrapper<T>)` 这类重载会直接变成"引用不明确"。

---

## 9. 编辑器与静态检查配置

| 文件 | 作用 | 注意 |
|---|---|---|
| `.editorconfig`（仓库根） | 编码/缩进/换行 | 改格式前先看这里 |
| `backend/<module>/.settings/org.eclipse.jdt.core.prefs` | Eclipse/JDT 工程配置 | **上半部分由 m2e 生成，不要手工重排**；下半部分两项自定义见下 |
| `.vscode/settings.json` | Java 语言服务器、排除规则 | 仅本机生效（`.vscode/` 在 `.gitignore` 里） |

两个自定义项（四个模块都必须一致）：

```
org.eclipse.jdt.core.compiler.problem.unusedPrivateMember=ignore   # Lombok 字段误报
org.eclipse.jdt.core.compiler.taskTags=                            # 关闭 TODO 任务标记
```

> ⚠️ 血泪教训：这份文件是**整套编译配置的唯一真源**（redhat.java 的工程位置指向仓库目录）。
> 曾经为了关掉几个告警把整份文件重写成单行，结果顶掉了 m2e 写入的
> `processAnnotations=enabled` 与 `compliance=25`，Lombok 注解处理被关闭，告警瞬间涨到 1835 条。
> **只增删自己要管的那一行，永远不要整份覆盖。**

### 自查命令（离线可用）

```bash
cd backend
./mvnw.cmd -o -DskipTests compile           # 编译
./mvnw.cmd -o -DskipTests test-compile      # 编译测试源码
```

要看 unchecked / raw type 明细时，临时在 `backend/pom.xml` 的 `maven-compiler-plugin` 里加：

```xml
<compilerArgs>
    <arg>-Xlint:unchecked</arg>
    <arg>-Xlint:rawtypes</arg>
    <arg>-Xmaxwarns</arg><arg>10000</arg>
</compilerArgs>
```

`-Xmaxwarns 10000` 很关键：javac 默认只报 100 条，不加会以为已经干净了。

---

## 10. 提交前检查清单

- [ ] `mvn -o -DskipTests compile` 与 `test-compile` 均通过
- [ ] IDE 内"问题"面板 0 error / 0 warning
- [ ] 没有新增未使用的 import、字段、局部变量
- [ ] 新增的 `Wrapper` / `Page` 都带了类型参数，或使用了 `<T>` helper / `Wrapper<?>`
- [ ] 新增的 `@SuppressWarnings` 都写了理由注释
- [ ] 没有把 `backend/pom.xml` 的临时 lint 参数提交上去
