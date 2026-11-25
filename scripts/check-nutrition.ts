// npx tsx scripts/check-nutrition.ts — smoke check of the reference/nutricion JSON → app types mapping.
import assert from 'node:assert';
import { nutritionMealRecipes as meals, nutritionSnackRecipes as snacks, guideSections } from '../src/nutritionData';

const all = [...meals, ...snacks];
assert.equal(all.length, 69);
assert.equal(new Set(all.map((r) => r.id)).size, all.length, 'duplicate ids');
assert(all.every((r) => /^(nut|tal)_/.test(r.id) && r.origin), 'id/origin');
assert(meals.every((r) => r.category), 'meal category not mapped');
assert.equal(guideSections.length, 13);
console.log(`ok: ${meals.length} comidas, ${snacks.length} desayunos/snacks, ${guideSections.length} secciones`);
