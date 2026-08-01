package com.angelica.recallpathbackend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("RecallPath AI API")
                        .version("1.0")
                        .description("REST API documentation for RecallPath AI backend")
                        .contact(new Contact()
                                .name("RecallPath AI Team")));
    }
}
