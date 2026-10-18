package com.chaynhac.api

import com.chaynhac.auth.currentUser
import com.chaynhac.recipe.AiQuotaResponse
import com.chaynhac.recipe.AiRecipeRequest
import com.chaynhac.recipe.RecipeDetailResponse
import com.chaynhac.recipe.RecipeService
import com.chaynhac.recipe.RecipeSummaryResponse
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1")
class RecipeController(
    private val recipeService: RecipeService,
) {
    @GetMapping("/recipes")
    fun list(
        @RequestParam(required = false) tag: String?,
        @RequestParam(required = false) maxMinutes: Int?,
        @RequestParam(defaultValue = "false") bookmarked: Boolean,
        @RequestParam(defaultValue = "false") noOnion: Boolean,
    ): List<RecipeSummaryResponse> = recipeService.list(currentUser().id, tag, maxMinutes, bookmarked, noOnion)

    @GetMapping("/recipes/{id}")
    fun get(@PathVariable id: UUID): RecipeDetailResponse = recipeService.get(currentUser().id, id)

    @PostMapping("/recipes/{id}/bookmark")
    fun bookmark(@PathVariable id: UUID): RecipeDetailResponse = recipeService.bookmark(currentUser().id, id)

    @DeleteMapping("/recipes/{id}/bookmark")
    fun removeBookmark(@PathVariable id: UUID) {
        recipeService.removeBookmark(currentUser().id, id)
    }

    @GetMapping("/ai/quota")
    fun quota(): AiQuotaResponse = recipeService.quota(currentUser().id)

    @PostMapping("/ai/recipes")
    fun suggest(@RequestBody(required = false) request: AiRecipeRequest?): RecipeDetailResponse =
        recipeService.suggest(currentUser().id, request ?: AiRecipeRequest())
}
