# backend/config —— 外部配置目录（注意加载优先级）

这个目录是 **Spring Boot 的「外部配置目录」**：当工作目录（CWD）为 `backend/` 时，
`file:./config/` 就指向这里，其中的 `application.yml` 会被自动加载，并且
**优先级高于 classpath 下的 `application-{profile}.yml`**。

## 谁会以 `backend/` 作为 CWD？

只有 `manager-api`：

```xml
<!-- backend/manager-api/pom.xml -->
<workingDirectory>${project.basedir}/..</workingDirectory>
```

设置它是为了让 `data/uploads`、`local-secrets.yml` 相对 `backend/` 解析。
`buyer-api` / `im-api` 没有这个设置，CWD 是各自的模块目录，不会加载本目录。

## 为什么会踩坑

`config/application.yml` 里是**集群部署**的中间件地址（如 `192.168.31.100:30379`）。
本地直接 `mvn spring-boot:run` 时，它会覆盖 classpath 里 `application-dev.yml` 的
`127.0.0.1`，于是启动失败：

```
RedisConnectionException: Unable to connect to Redis server: 192.168.31.100:30379
```

判断依据：报错里的 `connection timed out after 10000 ms` 对应本文件中的
`spring.data.redis.connect-timeout: 10s`（classpath 的配置里没有这个值）。

## 现在怎么组织的

| 文件 | 用途 | 谁加载 |
|---|---|---|
| `application.yml` | 集群/生产部署的集中配置模板 | 外部目录扫描（CWD=`backend/` 时） |
| `application-dev.yml` | **本地开发覆盖**：把 Redis/MySQL 指回 `127.0.0.1` | 同上，但优先级更高，`dev` profile 下生效 |

`application-dev.yml` 通过 `spring.config.import: optional:file:./local-secrets.yml`
复用 `backend/local-secrets.yml` 里的数据库密码（该文件 gitignored）。

## 改动这里时的检查清单

1. 改 `config/application.yml` 后，确认 `config/application-dev.yml` 仍然覆盖了
   本地需要覆盖的项（Redis host/port/password、datasource url）；
2. 本地启动验证：`cd backend && .\mvnw.cmd -o -pl manager-api -am -DskipTests spring-boot:run`
   日志里应出现 `The following 1 profile is active: "dev"` 与
   `connections initialized for 127.0.0.1/127.0.0.1:6379`；
3. 集群部署走 `prod` profile，本目录的 `application-dev.yml` 不生效。
