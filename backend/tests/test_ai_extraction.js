const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', 'MyRecipeApp', '.env') });
const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
console.log('Token available:', !!GITHUB_TOKEN);

if (!GITHUB_TOKEN) {
  console.error('No token found!');
  process.exit(1);
}

// Simulate the combined transcript that the frontend now builds
const transcript = `VIDEO TITLE: Veg Chowmein Recipe | How to boil Noodles Perfectly | Chef Sanjyot Keer

VIDEO DESCRIPTION:
Full written recipe for Veg Chowmein

Prep time: 20-25 minutes
Cooking time: 5-10 minutes
Serves: 3-4 people

Ingredients:
SALT TO TASTE (FOR NOODLES)
NOODLES 200 GRAMS
WATER AS REQUIRED
OIL 1-2 TBSP (FOR NOODLES)
OIL 2 TBSP
GINGER 1 TBSP (CHOPPED)
GARLIC 1 TBSP (CHOPPED)
GREEN CHILLI 2 NOS. (SLICED)
ONION 1 NO. (SLICED)
CARROT 1 NO. (JULIENNE)
CAPSICUM 1 NO. (JULIENNE)
CABBAGE 1/2 NO. (SHREDDED)
SUGAR A PINCH
SPRING ONION BULBS 2 TBSP
WHITE PEPPER POWDER A PINCH
SALT TO TASTE
DARK SOY SAUCE 1 TSP
VINEGAR 1/2 TSP
KETCHUP 1 TBSP
RED CHILLI SAUCE 1 TBSP
SPRING ONION GREENS A SMALL HANDFUL

Method:
Bring water to a roaring boil & add salt to taste.
Add noodles in the boiling water & only boil them for 30 seconds.
Switch off the flame & cover it for two to two & a half minutes.
Remove using tongs, rinse with cold water, drizzle oil to prevent sticking.
Set a wok over high heat, add oil. Add ginger, garlic & green chillies, toss for a minute.
Add all veggies with a pinch of sugar, toss over high flame for 30 seconds.
Add spring onion bulbs, boiled noodles, white pepper, salt & remaining ingredients, stir & cook for a minute.

VIDEO CAPTIONS/SUBTITLES:
noodles must be perfect for chowmein
the secret is not to boil too long
toss everything on high flame`;

axios.post('https://models.inference.ai.azure.com/chat/completions', {
  model: 'gpt-4o',
  messages: [
    {
      role: 'system',
      content: `You are a recipe extraction assistant. Extract recipe information from video transcripts and return it in JSON format with these fields:
- title: string (recipe name)
- category: string (MUST be one of: Breakfast, Lunch, Dinner, Dessert, Snacks, Appetizers, Asian, Vegan, Vegetarian)
- ingredients: string (newline-separated list)
- instructions: string (numbered steps)
- prepTime: string (e.g., "15 minutes")
- cookTime: string (e.g., "30 minutes")

IMPORTANT RULES:
1. ONLY use information that is explicitly mentioned in the transcript
2. Do NOT invent, guess, or add any ingredients or steps not present in the transcript
3. The transcript comes from auto-generated video captions and may be out of order - reconstruct the logical order
4. If the video contains multiple recipes, extract the MAIN/FIRST recipe
5. Ignore promotional text like "subscribe", "like", channel promos, etc.
6. If info is not mentioned, use empty string`
    },
    {
      role: 'user',
      content: `Extract the recipe from this cooking video transcript:\n\n${transcript}`
    }
  ],
  temperature: 0.1,
  max_tokens: 1000,
  response_format: { type: 'json_object' }
}, {
  headers: {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 15000
}).then(r => {
  console.log('AI Response:');
  console.log(JSON.stringify(JSON.parse(r.data.choices[0].message.content), null, 2));
}).catch(e => {
  console.error('Error:', e.response?.data || e.message);
});
