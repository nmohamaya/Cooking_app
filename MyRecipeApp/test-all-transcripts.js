/**
 * Comprehensive Test Suite - All 6 Transcripts
 */

const axios = require('axios');
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const API_URL = 'https://models.inference.ai.azure.com';
const MODEL_NAME = 'gpt-4o';

const testTranscripts = [
  {
    name: 'Test 1: Simple Recipe (Cookies)',
    transcript: `Hey everyone! Today I'm making classic chocolate chip cookies. 
So first, you'll need one stick of butter, softened. That's half a cup.
Then we have three-quarters cup of brown sugar and a quarter cup of white sugar.
You'll also need one egg, one teaspoon of vanilla extract.
For the dry ingredients: one and three-quarters cups of all-purpose flour, 
half a teaspoon of baking soda, and half a teaspoon of salt.
And of course, one and a half cups of chocolate chips.

Let me show you how to make these. Start by preheating your oven to 375 degrees Fahrenheit.
Step one: In a large bowl, cream together the softened butter with both sugars until fluffy. 
This takes about 2-3 minutes with an electric mixer.
Step two: Beat in the egg and vanilla extract until well combined.
Step three: In a separate bowl, whisk together the flour, baking soda, and salt.
Step four: Gradually add the dry ingredients to the wet ingredients, mixing until just combined.
Step five: Fold in the chocolate chips with a spatula.
Step six: Drop rounded tablespoons of dough onto a baking sheet lined with parchment paper. 
Leave about 2 inches between each cookie.
Step seven: Bake for 9 to 11 minutes, until the edges are golden brown but centers are still soft.
Let them cool on the baking sheet for 5 minutes before transferring to a wire rack.

Total prep time is about 15 minutes, and baking time is 10 minutes per batch. Enjoy!`,
    expectedQuality: 5
  },
  {
    name: 'Test 2: Complex Recipe (Beef Wellington)',
    transcript: `Right, today we're doing a proper Beef Wellington. This is a showstopper.
You'll need a two-pound beef tenderloin, center cut.
For the duxelles: eight ounces of mushrooms, finely chopped, two shallots minced, 
two cloves of garlic, two tablespoons of butter, and some fresh thyme.
You also need six slices of prosciutto, two tablespoons of Dijon mustard, 
one pound of puff pastry, and two egg yolks for the egg wash.
Season with salt and pepper.

Now, this takes time but it's worth it. First, season the beef generously with salt and pepper.
Heat a large pan with olive oil until smoking hot. Sear the beef on all sides until golden brown - 
about one minute per side. You want that crust. Remove and brush with mustard. Let it cool.

While that's cooling, make the duxelles. In the same pan, melt the butter. 
Add the mushrooms, shallots, and garlic. Cook on high heat, stirring frequently, 
until all the moisture has evaporated. This takes about 10 minutes. 
Add thyme, season with salt and pepper. Let it cool completely.

Lay out a large piece of plastic wrap. Arrange the prosciutto slices in overlapping rows.
Spread the cooled mushroom mixture over the prosciutto in an even layer.
Place the beef in the center and roll everything up tightly using the plastic wrap. 
Twist the ends to seal. Refrigerate for at least 30 minutes.

Roll out the puff pastry into a large rectangle, about 14 by 16 inches.
Remove the beef from the plastic wrap and place it in the center of the pastry.
Brush the edges with egg yolk. Fold the pastry over the beef, trimming any excess.
Seal the edges well. Place seam-side down on a baking sheet. Brush with more egg yolk.
You can score the top in a crosshatch pattern for decoration.

Refrigerate for another 15 minutes while you preheat the oven to 425 degrees Fahrenheit.
Bake for 25 minutes for medium-rare. Let it rest for 10 minutes before slicing.

Total prep time is about 45 minutes, cooking time is 25 minutes, plus resting time. 
This serves 4 to 6 people. Absolutely delicious.`,
    expectedQuality: 4
  },
  {
    name: 'Test 3: Vegan Recipe (Pasta)',
    transcript: `Hi friends! Making my favorite creamy vegan pasta today and it's so easy!
You need 12 ounces of pasta - I'm using fettuccine.
For the sauce: one cup of raw cashews soaked in hot water for 10 minutes,
one cup of vegetable broth, three cloves of garlic,
two tablespoons of nutritional yeast, juice of half a lemon,
half a teaspoon of salt, and a pinch of black pepper.
Optional: some fresh basil and cherry tomatoes for topping.

Okay, let's get started! First, put a large pot of salted water on to boil for the pasta.
While that's heating up, let's make the sauce.

Drain the soaked cashews and add them to a high-speed blender.
Pour in the vegetable broth, add the garlic cloves, nutritional yeast, lemon juice, salt, and pepper.
Blend on high speed for about one minute until completely smooth and creamy. Taste and adjust seasoning.

Once the water is boiling, add your pasta and cook according to package directions - usually 8 to 10 minutes.
Drain the pasta, but save half a cup of the pasta water.

Return the pasta to the pot over low heat. Pour in the creamy cashew sauce.
Toss everything together, adding a splash of pasta water if needed to thin the sauce.
Keep tossing until the pasta is well coated and the sauce is heated through - about one to two minutes.

Serve immediately, topped with fresh basil and halved cherry tomatoes if you like.

Prep time is 15 minutes including soaking the cashews, cook time is 10 minutes. 
This makes 4 servings and it's completely plant-based! So good!`,
    expectedQuality: 5
  },
  {
    name: 'Test 4: Precise Baking (Macarons)',
    transcript: `Welcome back to the channel! Today we're making French macarons. 
These are tricky but I'll walk you through it.

For the shells you need: one hundred grams of almond flour, sifted,
one hundred grams of powdered sugar, sifted,
one hundred grams of egg whites at room temperature - that's about 3 large eggs,
one hundred grams of granulated sugar,
and a quarter teaspoon of cream of tartar. You can add gel food coloring if desired.

For a simple buttercream filling: four ounces of butter softened, 
one cup of powdered sugar, one teaspoon of vanilla extract, and a pinch of salt.

These take time and precision. First, sift the almond flour and powdered sugar together twice. 
This is crucial for smooth shells. Set aside.

In a completely clean, grease-free bowl, beat the egg whites with cream of tartar on medium speed 
until they're foamy. Gradually add the granulated sugar one tablespoon at a time. 
Increase speed to high and beat until you have stiff, glossy peaks - about 5 minutes. 
If using food coloring, add it now.

Fold the dry ingredients into the meringue in three additions. Use a spatula and fold gently 
until the mixture flows like lava. It should fall in ribbons and slowly dissolve back into itself. 
This is called macaronage - don't overmix or undermix.

Transfer to a piping bag fitted with a round tip. Pipe one-inch circles onto baking sheets 
lined with parchment paper or silicone mats. Tap the sheets firmly on the counter 
to release air bubbles. Let them sit at room temperature for 30 to 60 minutes 
until they form a skin - they shouldn't be sticky when touched.

Preheat your oven to 300 degrees Fahrenheit. Bake one sheet at a time for 14 to 16 minutes. 
They should develop little feet at the bottom. Let them cool completely before removing from the sheet.

Meanwhile, make the buttercream by beating the butter until fluffy, 
then gradually adding powdered sugar, vanilla, and salt.

Match up shells by size, pipe filling on one, sandwich with another.
Refrigerate for 24 hours before eating - this lets the filling hydrate the shells perfectly.

Prep time is 30 minutes, baking time is 15 minutes per batch, plus resting time. 
Makes about 24 macarons. Good luck!`,
    expectedQuality: 4
  },
  {
    name: 'Test 5: Informal Recipe (Garlic Bread)',
    transcript: `What's up guys! Quick video showing you this amazing garlic bread recipe. 
Super simple, takes like 10 minutes.

So grab a baguette or French bread, whatever you got. Cut it in half lengthwise.
You need butter - I use like half a stick, maybe 4 tablespoons? 
Four or five cloves of garlic, minced up real fine. Some parsley if you have it, 
dried or fresh, doesn't matter. Maybe a teaspoon? And parmesan cheese, couple tablespoons.
Salt and pepper to taste.

Just mix all that together in a bowl - the softened butter, garlic, parsley, cheese, 
little bit of salt and pepper. Spread it all over the cut sides of the bread. 
Put it on a baking sheet. Into the oven at like 400 degrees for about 8 to 10 minutes 
until it's golden and crispy. That's it! Sometimes I broil it for a minute at the end 
to get it extra crispy but watch it carefully so it doesn't burn.

Takes maybe 5 minutes to prep, 10 minutes to bake. So easy and so good. Try it out!`,
    expectedQuality: 3
  },
  {
    name: 'Test 6: Incomplete Recipe (Stir Fry)',
    transcript: `Alright, so I'm making this chicken stir fry. You need some chicken breast, 
cut it into bite-sized pieces. Then like bell peppers, I'm using red and yellow, 
and some broccoli. Soy sauce for sure, and maybe some ginger.

So heat up your wok or a big pan, get it really hot. Add some oil and throw in the chicken. 
Cook it until it's not pink anymore. Then add the vegetables and stir fry for a few minutes. 
Pour in some soy sauce, toss everything together. And yeah, that's pretty much it. 
Serve over rice.`,
    expectedQuality: 2
  }
];

async function extractRecipe(transcript) {
  const response = await axios.post(
    `${API_URL}/chat/completions`,
    {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: `You are a recipe extraction assistant. Extract recipe information from video transcripts and return it in JSON format with these fields:
- title: string (recipe name)
- category: string (cuisine type)
- ingredients: string (newline-separated list)
- instructions: string (numbered steps)
- prepTime: string (e.g., "15 minutes")
- cookTime: string (e.g., "30 minutes")

If any field is not mentioned in the transcript, use empty string. Be concise and clear.`
        },
        {
          role: 'user',
          content: `Extract the recipe from this cooking video transcript:\n\n${transcript}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return {
    recipe: JSON.parse(response.data.choices[0].message.content),
    tokens: response.data.usage.total_tokens
  };
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   COMPREHENSIVE RECIPE EXTRACTION TEST SUITE              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const results = [];
  
  for (let i = 0; i < testTranscripts.length; i++) {
    const test = testTranscripts[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${test.name}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const startTime = Date.now();
    
    try {
      const { recipe, tokens } = await extractRecipe(test.transcript);
      const endTime = Date.now();
      const responseTime = ((endTime - startTime) / 1000).toFixed(2);
      
      const ingredientLines = (recipe.ingredients || '').split('\n').filter(l => l.trim()).length;
      const instructionLines = (recipe.instructions || '').split('\n').filter(l => l.trim()).length;
      
      const score = [
        !!recipe.title,
        !!recipe.category,
        !!recipe.ingredients && ingredientLines >= 3,
        !!recipe.instructions && instructionLines >= 3,
        !!recipe.prepTime,
        !!recipe.cookTime,
        parseFloat(responseTime) < 10
      ].filter(Boolean).length;
      
      results.push({
        name: test.name,
        success: true,
        responseTime,
        tokens,
        score,
        recipe,
        ingredientLines,
        instructionLines
      });
      
      console.log('✅ Status: SUCCESS');
      console.log(`⏱️  Response Time: ${responseTime}s`);
      console.log(`📊 Tokens: ${tokens}`);
      console.log(`⭐ Score: ${score}/7`);
      console.log(`\n🏷️  Title: ${recipe.title || '(empty)'}`);
      console.log(`📁 Category: ${recipe.category || '(empty)'}`);
      console.log(`⏱️  Prep: ${recipe.prepTime || '(empty)'} | Cook: ${recipe.cookTime || '(empty)'}`);
      console.log(`📋 Ingredients: ${ingredientLines} lines`);
      console.log(`📜 Instructions: ${instructionLines} steps`);
      
    } catch (error) {
      const endTime = Date.now();
      const responseTime = ((endTime - startTime) / 1000).toFixed(2);
      
      results.push({
        name: test.name,
        success: false,
        responseTime,
        error: error.message
      });
      
      console.log(`❌ Status: FAILED`);
      console.log(`⏱️  Response Time: ${responseTime}s`);
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Small delay between requests
    if (i < testTranscripts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 FINAL SUMMARY');
  console.log(`${'='.repeat(60)}\n`);
  
  const successCount = results.filter(r => r.success).length;
  const avgResponseTime = (results.filter(r => r.success).reduce((sum, r) => sum + parseFloat(r.responseTime), 0) / successCount).toFixed(2);
  const totalTokens = results.filter(r => r.success).reduce((sum, r) => sum + r.tokens, 0);
  const avgScore = (results.filter(r => r.success).reduce((sum, r) => sum + r.score, 0) / successCount).toFixed(1);
  
  console.log(`✅ Success Rate: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(0)}%)`);
  console.log(`⏱️  Avg Response Time: ${avgResponseTime}s`);
  console.log(`📊 Total Tokens Used: ${totalTokens}`);
  console.log(`⭐ Average Score: ${avgScore}/7 (${(avgScore/7*100).toFixed(0)}%)`);
  
  console.log('\n📋 Individual Results:\n');
  results.forEach((r, i) => {
    if (r.success) {
      const stars = '★'.repeat(r.score) + '☆'.repeat(7 - r.score);
      console.log(`${i + 1}. ${r.name.split(':')[1].trim()}: ${stars} (${r.responseTime}s)`);
    } else {
      console.log(`${i + 1}. ${r.name.split(':')[1].trim()}: ❌ FAILED (${r.error})`);
    }
  });
  
  console.log('\n🎯 Recommendations:\n');
  
  const avgRating = parseFloat(avgScore);
  if (avgRating >= 6.5) {
    console.log('✅ Feature is production-ready!');
    console.log('   - Extraction accuracy is excellent');
    console.log('   - Response times are acceptable');
    console.log('   - Consider adding UI improvements');
  } else if (avgRating >= 5.5) {
    console.log('👍 Feature is working well with room for improvement');
    console.log('   - Most extractions are successful');
    console.log('   - Consider improving handling of informal language');
    console.log('   - Test with more edge cases');
  } else if (avgRating >= 4.0) {
    console.log('⚠️  Feature needs improvements');
    console.log('   - Several extraction failures or inaccuracies');
    console.log('   - Review and improve AI prompt');
    console.log('   - Add better error handling');
  } else {
    console.log('❌ Feature requires significant work');
    console.log('   - High failure rate or poor extraction quality');
    console.log('   - Consider alternative AI models or approaches');
    console.log('   - Implement better validation');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
