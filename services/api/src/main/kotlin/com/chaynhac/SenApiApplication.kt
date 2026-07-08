package com.chaynhac

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

/** Spring Boot entry point for the Sen lunar-calendar and fasting API. */
@SpringBootApplication
class SenApiApplication

fun main(args: Array<String>) {
    runApplication<SenApiApplication>(*args)
}
