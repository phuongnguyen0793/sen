package com.chaynhac.recipe

import com.chaynhac.common.ApiException
import com.chaynhac.domain.AiGenerationEntity
import com.chaynhac.domain.BookmarkEntity
import com.chaynhac.domain.RecipeEntity
import com.chaynhac.repository.AiGenerationRepository
import com.chaynhac.repository.BookmarkRepository
import com.chaynhac.repository.RecipeRepository
import com.chaynhac.user.UserService
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestClient
import java.time.ZoneId
import java.util.UUID

data class LocalizedLine(val vi: String = "", val en: String = "")

data class RecipeSummaryResponse(
    val id: UUID,
    val title: String,
    val titleEn: String,
    val summary: String,
    val summaryEn: String,
    val cookMinutes: Int,
    val servings: Int,
    val tags: List<String>,
    val noOnionGarlic: Boolean,
    val source: String,
    val bookmarked: Boolean,
)

data class RecipeDetailResponse(
    val id: UUID,
    val title: String,
    val titleEn: String,
    val summary: String,
    val summaryEn: String,
    val ingredients: List<LocalizedLine>,
    val steps: List<LocalizedLine>,
    val cookMinutes: Int,
    val servings: Int,
    val tags: List<String>,
    val noOnionGarlic: Boolean,
    val source: String,
    val bookmarked: Boolean,
    val disclaimer: String,
)

data class AiQuotaResponse(val limit: Int, val used: Int, val remaining: Int)

data class AiRecipeRequest(val prompt: String? = null)

private const val DISCLAIMER =
    "Gợi ý món chỉ để tham khảo. Kiểm tra nguyên liệu trước khi nấu, nhất là khi ăn chay hoặc kiêng hành tỏi."

private val MEAT_WORDS =
    listOf("thịt", "cá ", "tôm", "gà", "bò", "heo", "mực", "pork", "beef", "chicken", "fish", "shrimp", "bacon")

@Service
class RecipeService(
    private val recipeRepository: RecipeRepository,
    private val bookmarkRepository: BookmarkRepository,
    private val aiGenerationRepository: AiGenerationRepository,
    private val userService: UserService,
    private val objectMapper: ObjectMapper,
    @Value("\${sen.ai.api-key:}") private val apiKey: String,
    @Value("\${sen.ai.daily-limit:2}") private val dailyLimit: Int,
) {
    private val http = RestClient.create()

    @Transactional(readOnly = true)
    fun list(userId: UUID, tag: String?, maxMinutes: Int?, bookmarkedOnly: Boolean, noOnionOnly: Boolean): List<RecipeSummaryResponse> {
        val bookmarks = bookmarkRepository.findByUserId(userId).map { it.recipe.id }.toSet()
        return recipeRepository.findAll().asSequence()
            .filter { tag.isNullOrBlank() || it.tags.split(",").any { value -> value.equals(tag, ignoreCase = true) } }
            .filter { maxMinutes == null || it.cookMinutes <= maxMinutes }
            .filter { !bookmarkedOnly || it.id in bookmarks }
            .filter { !noOnionOnly || it.noOnionGarlic }
            .sortedBy { it.title }
            .map { toSummary(it, it.id in bookmarks) }
            .toList()
    }

    @Transactional(readOnly = true)
    fun get(userId: UUID, recipeId: UUID): RecipeDetailResponse {
        val recipe = recipeRepository.findById(recipeId).orElseThrow {
            ApiException("RECIPE_NOT_FOUND", "Recipe not found", HttpStatus.NOT_FOUND)
        }
        val bookmarked = bookmarkRepository.findByUserIdAndRecipeId(userId, recipeId).isPresent
        return toDetail(recipe, bookmarked)
    }

    @Transactional
    fun bookmark(userId: UUID, recipeId: UUID): RecipeDetailResponse {
        val recipe = recipeRepository.findById(recipeId).orElseThrow {
            ApiException("RECIPE_NOT_FOUND", "Recipe not found", HttpStatus.NOT_FOUND)
        }
        if (bookmarkRepository.findByUserIdAndRecipeId(userId, recipeId).isEmpty) {
            bookmarkRepository.save(BookmarkEntity(user = userService.findActiveUser(userId), recipe = recipe))
        }
        return toDetail(recipe, true)
    }

    @Transactional
    fun removeBookmark(userId: UUID, recipeId: UUID) {
        bookmarkRepository.deleteByUserIdAndRecipeId(userId, recipeId)
    }

    @Transactional(readOnly = true)
    fun quota(userId: UUID): AiQuotaResponse {
        val used = usedToday(userId)
        return AiQuotaResponse(limit = dailyLimit, used = used, remaining = (dailyLimit - used).coerceAtLeast(0))
    }

    @Transactional
    fun suggest(userId: UUID, request: AiRecipeRequest): RecipeDetailResponse {
        val user = userService.findActiveUser(userId)
        if (usedToday(userId) >= dailyLimit) {
            throw ApiException("AI_QUOTA_EXCEEDED", "Daily suggestion limit reached", HttpStatus.TOO_MANY_REQUESTS)
        }
        if (apiKey.isBlank()) {
            throw ApiException(
                "AI_UNAVAILABLE",
                "Recipe suggestions are offline. Here are curated dishes instead.",
                HttpStatus.SERVICE_UNAVAILABLE,
                fallbackIds(user.preferNoOnionGarlic),
            )
        }
        val generation = aiGenerationRepository.save(
            AiGenerationEntity(
                user = user,
                promptMeta = objectMapper.writeValueAsString(mapOf("noOnion" to user.preferNoOnionGarlic)),
            ),
        )
        val generated = callModel(request.prompt, user.preferNoOnionGarlic)
        val blob = objectMapper.writeValueAsString(generated)
        if (MEAT_WORDS.any { blob.lowercase().contains(it) }) {
            throw ApiException(
                "AI_UNSAFE",
                "The suggestion included ingredients that are not vegetarian.",
                HttpStatus.UNPROCESSABLE_ENTITY,
                fallbackIds(user.preferNoOnionGarlic),
            )
        }
        val saved = recipeRepository.save(
            RecipeEntity(
                title = generated.title.ifBlank { "Món gợi ý" },
                titleEn = generated.titleEn.ifBlank { generated.title },
                summary = generated.summary,
                summaryEn = generated.summaryEn.ifBlank { generated.summary },
                ingredients = objectMapper.writeValueAsString(generated.ingredients),
                steps = objectMapper.writeValueAsString(generated.steps),
                cookMinutes = generated.cookMinutes.coerceIn(5, 180),
                servings = generated.servings.coerceIn(1, 12),
                tags = "ai",
                noOnionGarlic = user.preferNoOnionGarlic,
                source = "ai",
            ),
        )
        generation.resultRecipeId = saved.id
        aiGenerationRepository.save(generation)
        return toDetail(saved, false)
    }

    private fun usedToday(userId: UUID): Int {
        val user = userService.findActiveUser(userId)
        val start = java.time.LocalDate.now(ZoneId.of(user.timezone)).atStartOfDay(ZoneId.of(user.timezone)).toInstant()
        return aiGenerationRepository.countByUserIdAndCreatedAtGreaterThanEqual(userId, start).toInt()
    }

    private fun fallbackIds(noOnion: Boolean): List<UUID> =
        recipeRepository.findBySourceOrderByCreatedAtDesc("curated")
            .filter { !noOnion || it.noOnionGarlic }
            .take(3)
            .map { it.id }

    private fun callModel(prompt: String?, noOnion: Boolean): GeneratedRecipe {
        val system = buildString {
            append("Return JSON only with keys title, titleEn, summary, summaryEn, cookMinutes, servings, ")
            append("ingredients (array of {vi, en}), steps (array of {vi, en}). ")
            append("Vietnamese vegetarian fasting food. No meat, fish, or seafood.")
            if (noOnion) append(" No onion, garlic, shallot, or scallion.")
        }
        val raw = http.post()
            .uri("https://api.openai.com/v1/chat/completions")
            .contentType(MediaType.APPLICATION_JSON)
            .header("Authorization", "Bearer $apiKey")
            .body(mapOf(
                "model" to "gpt-4o-mini",
                "response_format" to mapOf("type" to "json_object"),
                "messages" to listOf(
                    mapOf("role" to "system", "content" to system),
                    mapOf("role" to "user", "content" to (prompt?.take(280)?.ifBlank { null } ?: "Gợi ý một món chay cho hôm nay")),
                ),
            ))
            .retrieve()
            .body(Map::class.java)
            ?: throw ApiException("AI_UNAVAILABLE", "Empty suggestion response", HttpStatus.SERVICE_UNAVAILABLE, fallbackIds(noOnion))
        val content = ((raw["choices"] as? List<*>)?.firstOrNull() as? Map<*, *>)
            ?.get("message").let { (it as? Map<*, *>)?.get("content") as? String }
            ?: throw ApiException("AI_UNAVAILABLE", "Suggestion could not be read", HttpStatus.SERVICE_UNAVAILABLE, fallbackIds(noOnion))
        return objectMapper.readValue(content)
    }

    private fun toSummary(recipe: RecipeEntity, bookmarked: Boolean) =
        RecipeSummaryResponse(
            id = recipe.id,
            title = recipe.title,
            titleEn = recipe.titleEn,
            summary = recipe.summary,
            summaryEn = recipe.summaryEn,
            cookMinutes = recipe.cookMinutes,
            servings = recipe.servings,
            tags = recipe.tags.split(",").filter { it.isNotBlank() },
            noOnionGarlic = recipe.noOnionGarlic,
            source = recipe.source,
            bookmarked = bookmarked,
        )

    private fun toDetail(recipe: RecipeEntity, bookmarked: Boolean) =
        RecipeDetailResponse(
            id = recipe.id,
            title = recipe.title,
            titleEn = recipe.titleEn,
            summary = recipe.summary,
            summaryEn = recipe.summaryEn,
            ingredients = objectMapper.readValue(recipe.ingredients),
            steps = objectMapper.readValue(recipe.steps),
            cookMinutes = recipe.cookMinutes,
            servings = recipe.servings,
            tags = recipe.tags.split(",").filter { it.isNotBlank() },
            noOnionGarlic = recipe.noOnionGarlic,
            source = recipe.source,
            bookmarked = bookmarked,
            disclaimer = DISCLAIMER,
        )
}

private data class GeneratedRecipe(
    val title: String = "",
    val titleEn: String = "",
    val summary: String = "",
    val summaryEn: String = "",
    val cookMinutes: Int = 20,
    val servings: Int = 2,
    val ingredients: List<LocalizedLine> = emptyList(),
    val steps: List<LocalizedLine> = emptyList(),
)
