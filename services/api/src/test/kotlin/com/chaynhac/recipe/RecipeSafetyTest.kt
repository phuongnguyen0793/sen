package com.chaynhac.recipe

import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class RecipeSafetyTest {
    @Test
    fun `vegetarian phrases that contain meat letters are allowed`() {
        assertFalse(containsMeat("Hôm nay ăn nấm đùi gà với rau"))
        assertFalse(containsMeat("""{"vi":"Nấm đùi gà"}"""))
    }

    @Test
    fun `meat words are rejected as whole words`() {
        assertTrue(containsMeat("thịt gà kho"))
        assertTrue(containsMeat("cá kho tộ"))
        assertTrue(containsMeat("kho thịt heo"))
        assertTrue(containsMeat("gà luộc"))
        assertTrue(containsMeat("grilled chicken"))
        assertFalse(containsMeat("cách nấu chay"))
        assertFalse(containsMeat("Hôm nay ăn chay theo lịch"))
        assertFalse(containsMeat("""{"summary":"Hôm nay","steps":[{"vi":"Nấu theo công thức"}]}"""))
    }
}
