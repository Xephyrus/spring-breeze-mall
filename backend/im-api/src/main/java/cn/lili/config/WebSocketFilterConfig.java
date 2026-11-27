package cn.lili.config;

import org.apache.tomcat.websocket.server.WsFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

/**
 * 显式注册 Tomcat 的 WebSocket 升级过滤器 {@link WsFilter}。
 *
 * <p>背景：{@code im-api} 使用 JSR-356（{@code @ServerEndpoint} + {@code ServerEndpointExporter}）
 * 暴露 {@code /lili/webSocket/{accessToken}}。实测（Spring Boot 4 + Tomcat 11）升级握手
 * 返回 **HTTP 400**，且 TRACE 日志里没有任何 {@code org.apache.tomcat.websocket} 输出——
 * 说明 {@code WsFilter} 没有被 {@code WsSci} 挂进 Servlet 过滤器链，请求在
 * 「安全链之后、Spring MVC 之前」被拒。
 *
 * <p>本类把 {@code WsFilter} 显式注册为**最高优先级**（早于 Spring Security 的
 * {@code springSecurityFilterChain}，其 order 为 -100），使升级请求重新走 Tomcat 的
 * WebSocket 升级通道。
 *
 * <p>注意：过滤器依赖 ServletContext 上的
 * {@code jakarta.websocket.server.ServerContainer} 属性（由 Tomcat 的 WsSci 创建），
 * {@code ServerEndpointExporter} 把端点注册到该容器；两者缺一不可。
 */
@Configuration
public class WebSocketFilterConfig {

    /**
     * 注册 WsFilter，映射到所有路径并置顶。
     *
     * @return 过滤器注册对象
     */
    @Bean
    public FilterRegistrationBean<WsFilter> wsFilterRegistration() {
        FilterRegistrationBean<WsFilter> registration = new FilterRegistrationBean<>(new WsFilter());
        registration.setName("wsFilter");
        registration.addUrlPatterns("/*");
        // 必须早于 Spring Security（默认 order = -100），否则升级请求先被安全链处理
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
