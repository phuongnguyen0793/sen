package com.chaynhac.api

import com.chaynhac.auth.AuthService
import com.chaynhac.auth.RegisterRequest
import com.chaynhac.domain.RecipeEntity
import com.chaynhac.repository.RecipeRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RecipeApiIntegrationTest {
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var objectMapper: ObjectMapper
    @Autowired private lateinit var authService: AuthService
    @Autowired private lateinit var recipeRepository: RecipeRepository

    @Test
    fun listBookmarkAndOfflineSuggestion() {
        val tokens = authService.register(RegisterRequest("recipe-${UUID.randomUUID()}@sen.test", "password123"))
        val recipe = recipeRepository.save(
            RecipeEntity(
                title = "Canh",
                titleEn = "Soup",
                summary = "Ngọt",
                summaryEn = "Sweet",
                ingredients = """[{"vi":"Bí","en":"Pumpkin"}]""",
                steps = """[{"vi":"Nấu","en":"Simmer"}]""",
                cookMinutes = 15,
                servings = 2,
                tags = "easy,soup",
                noOnionGarlic = true,
                source = "curated",
            ),
        )

        mockMvc.get("/api/v1/recipes?tag=soup") {
            header("Authorization", "Bearer ${tokens.accessToken}")
        }.andExpect {
            status { isOk() }
            jsonPath("$[0].title") { value("Canh") }
            jsonPath("$[0].bookmarked") { value(false) }
        }

        mockMvc.post("/api/v1/recipes/${recipe.id}/bookmark") {
            header("Authorization", "Bearer ${tokens.accessToken}")
        }.andExpect {
            status { isOk() }
            jsonPath("$.bookmarked") { value(true) }
            jsonPath("$.disclaimer") { exists() }
        }

        mockMvc.delete("/api/v1/recipes/${recipe.id}/bookmark") {
            header("Authorization", "Bearer ${tokens.accessToken}")
        }.andExpect {
            status { isOk() }
        }

        mockMvc.get("/api/v1/ai/quota") {
            header("Authorization", "Bearer ${tokens.accessToken}")
        }.andExpect {
            status { isOk() }
            jsonPath("$.remaining") { value(2) }
        }

        mockMvc.post("/api/v1/ai/recipes") {
            header("Authorization", "Bearer ${tokens.accessToken}")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(mapOf("prompt" to "món nhanh"))
        }.andExpect {
            status { isServiceUnavailable() }
            jsonPath("$.code") { value("AI_UNAVAILABLE") }
            jsonPath("$.fallbackRecipeIds") { exists() }
        }
    }
}
