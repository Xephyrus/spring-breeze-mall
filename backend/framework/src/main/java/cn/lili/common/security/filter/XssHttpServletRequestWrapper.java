package cn.lili.common.security.filter;

import cn.hutool.core.text.CharSequenceUtil;
import cn.hutool.json.JSONUtil;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import lombok.extern.slf4j.Slf4j;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Enumeration;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 防止Xss
 *
 * @author Chopper
 * @version v1.0
 * 2021-06-04 10:39
 */
@Slf4j
public class XssHttpServletRequestWrapper extends HttpServletRequestWrapper {

    //允许的标签
    private static final String[] allowedTags = {"h1", "h2", "h3", "h4", "h5", "h6",
            "span", "strong",
            "img", "video", "source", "iframe", "code",
            "blockquote", "p", "div",
            "ul", "ol", "li",
            "table", "thead", "caption", "tbody", "tr", "th", "td", "br",
            "a"
    };

    //需要转化的标签
    private static final String[] needTransformTags = {"article", "aside", "command", "datalist", "details", "figcaption", "figure",
            "footer", "header", "hgroup", "section", "summary"};

    //带有超链接的标签
    private static final String[] linkTags = {"img", "video", "source", "a", "iframe", "p"};

    //带有超链接的标签
    private static final String[] allowAttributes = {"style", "src", "href", "target", "width", "height"};

    /**
     * OWASP HTML 安全清洗策略（不可变且线程安全，作为静态常量全局单例复用，避免每次请求重复构建）
     */
    private static final PolicyFactory POLICY = new HtmlPolicyBuilder()
            .allowStandardUrlProtocols()
            // 所有允许的标签
            .allowElements(allowedTags)
            // 内容标签转化为div
            .allowElements((elementName, attributes) -> "div", needTransformTags)
            .allowAttributes(allowAttributes).onElements(linkTags)
            .allowStyling()
            .toFactory();

    /**
     * 这些请求头的值是 HTTP 协议语义，从不作为 HTML 渲染，不能做 HTML 清洗。
     * 典型事故：Range: bytes=0-1023 被清洗成 bytes&#61;0-1023，导致视频分段请求返回 416。
     */
    private static final Set<String> RAW_HEADERS = Set.of(
            "range", "if-range", "content-range", "content-length", "content-type",
            "accept", "accept-encoding", "accept-language",
            "if-modified-since", "if-none-match", "if-match",
            "authorization", "cookie", "origin", "referer", "host", "connection",
            "cache-control", "pragma", "expires", "user-agent",
            "x-forwarded-for", "x-real-ip", "x-requested-with", "clienttype"
    );

    /**
     * 数字字符引用（如 &#xff0c; / &#65292;）。
     * <p>
     * OWASP 清洗器输出 HTML 时，会把不属于 ASCII 的字符序列化成数字实体 ——
     * 中文全角标点全部中招：写入「神秘的铂金会员，其数量寥寥无几」，
     * 库里存的却是「神秘的铂金会员&#xff0c;其数量寥寥无几」，列表/详情都会显示成实体。
     */
    private static final Pattern NUMERIC_ENTITY =
            Pattern.compile("&#(?:[xX]([0-9a-fA-F]{1,6})|([0-9]{1,7}));");

    public XssHttpServletRequestWrapper(HttpServletRequest request) {
        super(request);
    }

    /**
     * 对数组参数进行特殊字符过滤
     */
    @Override
    public String[] getParameterValues(String name) {
        String[] values = super.getParameterValues(name);
        if (values == null) {
            return new String[0];
        }
        int count = values.length;
        String[] encodedValues = new String[count];
        for (int i = 0; i < count; i++) {
            encodedValues[i] = sanitizeParameter(name, values[i]);
        }
        return encodedValues;
    }

    /**
     * 对参数中特殊字符进行过滤
     */
    @Override
    public String getParameter(String name) {
        String description = super.getParameter(name);
        if (description == null) {
            return null;
        }
        return sanitizeParameter(name, description);
    }

    /**
     * 获取attribute,特殊字符过滤
     */
    @Override
    public Object getAttribute(String name) {
        Object description = super.getAttribute(name);
        if (description instanceof String) {
            description = filterXss(name, (String) description);
        }
        return description;
    }

    /**
     * 对请求头部进行特殊字符过滤
     */
    @Override
    public String getHeader(String name) {
        String description = super.getHeader(name);
        if (description == null) {
            return null;
        }
        // 协议头保持原样（Range/条件请求/鉴权等），只清洗可能被回显的普通头。
        // 事故案例：Range: bytes=0-1023 曾被打平成 bytes&#61;0-1023，导致视频分段请求 416。
        if (name != null && RAW_HEADERS.contains(name.toLowerCase(Locale.ROOT))) {
            return description;
        }
        return filterXss(name, description);
    }

    @Override
    public Enumeration<String> getHeaders(String name) {
        Enumeration<String> values = super.getHeaders(name);
        if (name != null && RAW_HEADERS.contains(name.toLowerCase(Locale.ROOT))) {
            return values;
        }
        List<String> cleaned = new ArrayList<>();
        while (values.hasMoreElements()) {
            cleaned.add(filterXss(name, values.nextElement()));
        }
        return Collections.enumeration(cleaned);
    }

    @Override
    public Map<String, String[]> getParameterMap() {
        Map<String, String[]> parameterMap = super.getParameterMap();
        //因为super.getParameterMap()返回的是Map,所以我们需要定义Map的实现类对数据进行封装
        Map<String, String[]> params = new LinkedHashMap<>();
        //如果参数不为空
        if (parameterMap != null) {
            //对map进行遍历
            for (Map.Entry<String, String[]> entry : parameterMap.entrySet()) {
                //根据key获取value
                String[] values = entry.getValue();
                //遍历数组
                for (int i = 0; i < values.length; i++) {
                    String description = values[i];
                    description = sanitizeParameter(entry.getKey(), description);
                    //将转义后的数据放回数组中
                    values[i] = description;
                }

                //将转义后的数组put到linkMap当中
                params.put(entry.getKey(), values);
            }
        }
        return params;
    }

    /**
     * 获取输入流
     *
     * @return 过滤后的输入流
     * @throws IOException 异常信息
     */
    @Override
    public ServletInputStream getInputStream() throws IOException {

        BufferedReader bufferedReader = null;
        InputStreamReader reader = null;

        //获取输入流
        ServletInputStream in = null;
        try {
            in = super.getInputStream();
            //用于存储输入流
            StringBuilder body = new StringBuilder();
            reader = new InputStreamReader(in, StandardCharsets.UTF_8);
            bufferedReader = new BufferedReader(reader);
            //按行读取输入流
            String line = bufferedReader.readLine();
            while (line != null) {
                //将获取到的第一行数据append到StringBuffer中
                body.append(line);
                //继续读取下一行流，直到line为空
                line = bufferedReader.readLine();
            }

            // 兼容替换：不再使用过时的 JSONUtil.isJsonObj(String)，改为尝试解析并捕获异常
            if (CharSequenceUtil.isNotEmpty(body)) {
                Map<String, Object> map = null;
                try {
                    map = JSONUtil.parseObj(body.toString());
                } catch (Exception ignore) {
                    map = null;
                }
                if (map != null) {
                    //创建空的map用于存储结果
                    Map<String, Object> resultMap = new HashMap<>(map.size());
                    //遍历数组
                    for (Map.Entry<String, Object> entry : map.entrySet()) {
                        //如果map.get(key)获取到的是字符串就需要进行处理，如果不是直接存储resultMap
                        if (map.get(entry.getKey()) instanceof String) {
                            String text = entry.getValue().toString();
                            // 字段值是「JSON 里再放一段 JSON」（典型：pageData 内嵌整份装修数据）：
                            // 必须按 JSON 递归清洗并原样序列化回字符串，不能交给 HTML 清洗器整段处理，
                            // 否则清洗器会把内嵌 JSON 的引号重新序列化成 src="\" 之类，整段 JSON 直接非法。
                            resultMap.put(entry.getKey(), looksLikeJson(text) ? sanitizeJsonText(entry.getKey(), text) : filterXss(entry.getKey(), text));
                        } else if (looksLikeJson(String.valueOf(entry.getValue()))) {
                            resultMap.put(entry.getKey(), sanitizeJsonValue(entry.getValue()));
                        } else {
                            resultMap.put(entry.getKey(), entry.getValue());
                        }
                    }

                    //将resultMap转换为json字符串
                    String resultStr = JSONUtil.toJsonStr(resultMap);
                    //将json字符串转换为字节
                    final ByteArrayInputStream resultBIS = new ByteArrayInputStream(resultStr.getBytes(StandardCharsets.UTF_8));

                    //实现接口
                    return new ServletInputStream() {
                        @Override
                        public boolean isFinished() {
                            return false;
                        }

                        @Override
                        public boolean isReady() {
                            return false;
                        }

                        @Override
                        public void setReadListener(ReadListener readListener) {
                        }

                        @Override
                        public int read() {
                            return resultBIS.read();
                        }
                    };
                }
            }

            //将json字符串转换为字节
            final ByteArrayInputStream bis = new ByteArrayInputStream(body.toString().getBytes(StandardCharsets.UTF_8));
            //实现接口
            return new ServletInputStream() {
                @Override
                public boolean isFinished() {
                    return false;
                }

                @Override
                public boolean isReady() {
                    return false;
                }

                @Override
                public void setReadListener(ReadListener readListener) {

                }

                @Override
                public int read() {
                    return bis.read();
                }
            };
        } catch (Exception e) {

            log.error("get request inputStream error", e);
            return null;
        } finally {
            //关闭流
            if (bufferedReader != null) {
                bufferedReader.close();
            }
            if (reader != null) {
                reader.close();
            }
            if (in != null) {
                in.close();
            }
        }

    }

    /**
     * 对输入内容执行 XSS 安全清洗。
     * 直接返回经 OWASP 策略清洗后的结果，禁止二次调用 HtmlUtil.unescape 进行反转义，
     * 避免攻击者通过 HTML 实体编码绕过过滤器并在反转义后还原出恶意可执行脚本。
     *
     * @param value 原始输入字符串
     * @return 清洗后的安全字符串
     */
    private String cleanXSS(String value) {
        if (value == null) {
            return null;
        }
        return restoreNonAsciiEntities(POLICY.sanitize(value));
    }

    /**
     * 把清洗结果里的「非 ASCII 数字实体」还原成原字符。
     * <p>
     * 安全性：HTML 危险字符（{@code < > & " '}）码位都小于 0x80，它们仍保持转义状态，
     * 因此该还原不会重新引入可执行标签；被还原的只有中文、全角标点、emoji 等文本字符。
     *
     * @param value 清洗后的字符串
     * @return 还原了非 ASCII 字符的字符串
     */
    private static String restoreNonAsciiEntities(String value) {
        if (value == null || value.indexOf("&#") < 0) {
            return value;
        }
        Matcher matcher = NUMERIC_ENTITY.matcher(value);
        StringBuilder sb = new StringBuilder(value.length());
        while (matcher.find()) {
            String hex = matcher.group(1);
            int codePoint;
            try {
                codePoint = hex != null ? Integer.parseInt(hex, 16) : Integer.parseInt(matcher.group(2));
            } catch (NumberFormatException e) {
                matcher.appendReplacement(sb, Matcher.quoteReplacement(matcher.group()));
                continue;
            }
            // 只还原 >= 0x80 的码位
            String replacement = codePoint >= 0x80 && Character.isValidCodePoint(codePoint)
                    ? new String(Character.toChars(codePoint))
                    : matcher.group();
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    /**
     * 过滤xss
     *
     * @param name  参数名
     * @param value 参数值
     * @return 参数值
     */
    private String filterXss(String name, String value) {
        return cleanXSS(value);
    }

    /**
     * 表单参数统一清洗入口。
     * <p>
     * 关键：装修保存用的是 {@code application/x-www-form-urlencoded}，参数 {@code pageData}
     * 的值本身就是一段 JSON。如果直接交给 OWASP HTML 清洗器，清洗器会把内嵌 JSON 的引号
     * 重新序列化（{@code src="\"} 之类），整段 JSON 立刻非法，页面再也打不开。
     * <p>
     * 因此：看起来是 JSON 的参数走 JSON 递归清洗，其余才走 HTML 清洗。
     *
     * @param name  参数名
     * @param value 参数值
     * @return 清洗后的值
     */
    private String sanitizeParameter(String name, String value) {
        if (looksLikeJson(value)) {
            return sanitizeJsonText(name, value);
        }
        return filterXss(name, value);
    }

    /**
     * 快速判断字符串是否"像 JSON"：只看首个非空白字符是 { 或 [。
     * <p>
     * 比"首尾都匹配"更宽松 —— 内容已损坏时首字符仍是 {，必须按 JSON 处理，
     * 绝不能因为尾部不匹配而落到 HTML 清洗分支（那会把引号重新序列化，造成不可逆损坏）。
     */
    /**
     * 判断是否为 URL（http/https 或站内 / 静态路径）。
     * <p>
     * 这类值只做展示与跳转，不含可执行 HTML，跳过清洗既安全又不会破坏签名里的特殊字符。
     *
     * @param text 待判断字符串
     * @return 是否 URL
     */
    private static boolean looksLikeUrl(String text) {
        if (text == null) {
            return false;
        }
        String t = text.trim();
        return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/files/");
    }

    private static boolean looksLikeJson(String text) {
        if (text == null) {
            return false;
        }
        String trimmed = text.trim();
        if (trimmed.isEmpty()) {
            return false;
        }
        char first = trimmed.charAt(0);
        return first == '{' || first == '[';
    }

    private static boolean isJsonText(Object value) {
        if (value == null) {
            return false;
        }
        String text = value.toString().trim();
        if (text.length() < 2) {
            return false;
        }
        char first = text.charAt(0);
        char last = text.charAt(text.length() - 1);
        return (first == '{' && last == '}') || (first == '[' && last == ']');
    }

    /**
     * 清洗「JSON 文本」：解析后递归清洗字符串叶子，再序列化回字符串。
     * <p>
     * 这样既保留了 XSS 防护（叶子 HTML 仍走 OWASP 策略），又不会破坏 JSON 结构。
     * 解析失败时退化为普通字符串清洗。
     */
    private String sanitizeJsonText(String key, String text) {
        try {
            Object parsed = JSONUtil.parse(text);
            return JSONUtil.toJsonStr(sanitizeJsonValue(parsed));
        } catch (Exception e) {
            // 解析失败说明这份 JSON 已经坏了：此时绝不能交给 HTML 清洗器（会把引号重新序列化，
            // 让内容彻底不可恢复），原样放行，由业务层决定如何处理。
            log.warn("字段[{}]看起来是JSON但解析失败，已原样放行以避免二次破坏", key);
            return text;
        }
    }

    /**
     * 递归清洗 JSON 结构里的字符串叶子，其余类型原样返回。
     */
    private Object sanitizeJsonValue(Object value) {
        if (value instanceof CharSequence) {
            String text = value.toString();
            // 叶子值本身也可能是 JSON 文本（典型：商品 specs 字段存的是 {"images":[...]}）。
            // 这类值不能当 HTML 清洗：OWASP 会把引号转成 &#34;，把业务数据彻底改坏。
            // 这里按"字符串里再放一段 JSON"处理，清洗完再序列化回字符串。
            if (looksLikeJson(text)) {
                return sanitizeJsonText("nested", text);
            }
            if (looksLikeUrl(text)) {
                return text;
            }
            return cleanXSS(text);
        }
        if (value instanceof Map) {
            Map<String, Object> result = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
                result.put(String.valueOf(entry.getKey()), sanitizeJsonValue(entry.getValue()));
            }
            return result;
        }
        if (value instanceof List) {
            List<Object> result = new ArrayList<>();
            for (Object item : (List<?>) value) {
                result.add(sanitizeJsonValue(item));
            }
            return result;
        }
        return value;
    }

}
