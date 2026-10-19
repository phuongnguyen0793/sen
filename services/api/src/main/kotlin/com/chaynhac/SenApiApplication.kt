package com.chaynhac

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableScheduling

/** Spring Boot entry point for the Sen lunar-calendar and fasting API. */
@SpringBootApplication
@EnableScheduling
class SenApiApplication

fun main(args: Array<String>) {
    runApplication<SenApiApplication>(*args)
}
