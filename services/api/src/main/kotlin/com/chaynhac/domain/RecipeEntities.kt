package com.chaynhac.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "recipes")
class RecipeEntity(
    @Id
    val id: UUID = UUID.randomUUID(),
    @Column(nullable = false)
    var title: String,
    @Column(name = "title_en", nullable = false)
    var titleEn: String,
    @Column(nullable = false)
    var summary: String,
    @Column(name = "summary_en", nullable = false)
    var summaryEn: String,
    @Column(nullable = false)
    var ingredients: String,
    @Column(nullable = false)
    var steps: String,
    @Column(name = "cook_minutes", nullable = false)
    var cookMinutes: Int,
    @Column(nullable = false)
    var servings: Int,
    @Column(nullable = false)
    var tags: String,
    @Column(name = "no_onion_garlic", nullable = false)
    var noOnionGarlic: Boolean = false,
    @Column(nullable = false)
    var source: String,
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
)

@Entity
@Table(
    name = "bookmarks",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "recipe_id"])],
)
class BookmarkEntity(
    @Id
    val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    val user: UserEntity,
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id", nullable = false)
    val recipe: RecipeEntity,
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
)

@Entity
@Table(name = "ai_generations")
class AiGenerationEntity(
    @Id
    val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    val user: UserEntity,
    @Column(name = "prompt_meta", nullable = false)
    val promptMeta: String,
    @Column(name = "result_recipe_id")
    var resultRecipeId: UUID? = null,
    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
)
