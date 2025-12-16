/**
 * Automated API Test for Recipe Extraction
 * This script tests the GitHub Models API directly
 */

const axios = require('axios');
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const API_URL = 'https://models.inference.ai.azure.com';
const MODEL_NAME = 'gpt-4o';

// Test transcript (simple recipe)
const testTranscript = `
Hey everyone! Today I'm making classic chocolate chip cookies. 
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

Total prep time is about 15 minutes, and baking time is 10 minutes per batch. Enjoy!
`;

async function testExtraction() {
  console.log('🧪 Testing Recipe Extraction API...\n');
  
  // Check token
  if (!GITHUB_TOKEN) {
    console.error('❌ Error: GITHUB_TOKEN not found in .env file');
    process.exit(1);
  }
  
  console.log('✓ GitHub token found:', GITHUB_TOKEN.substring(0, 10) + '...');
  console.log('✓ API URL:', API_URL);
  console.log('✓ Model:', MODEL_NAME);
  console.log('\n📝 Test transcript length:', testTranscript.length, 'characters\n');
  
  const startTime = Date.now();
  
  try {
    console.log('🚀 Sending request to GitHub Models API...');
    
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
            content: `Extract the recipe from this cooking video transcript:\n\n${testTranscript}`
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
    
    const endTime = Date.now();
    const responseTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ Success! Response received in ${responseTime} seconds\n`);
    
    // Parse the response
    const content = response.data.choices[0].message.content;
    const recipe = JSON.parse(content);
    
    // Display results
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 EXTRACTION RESULTS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('🏷️  Title:', recipe.title || '(empty)');
    console.log('📁 Category:', recipe.category || '(empty)');
    console.log('⏱️  Prep Time:', recipe.prepTime || '(empty)');
    console.log('🔥 Cook Time:', recipe.cookTime || '(empty)');
    
    console.log('\n📝 Ingredients:');
    console.log('─────────────────────────────────────────────────────');
    console.log(recipe.ingredients || '(empty)');
    
    console.log('\n👨‍🍳 Instructions:');
    console.log('─────────────────────────────────────────────────────');
    console.log(recipe.instructions || '(empty)');
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📈 PERFORMANCE METRICS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('⏱️  Response Time:', responseTime, 'seconds');
    console.log('📊 Tokens Used:', response.data.usage?.total_tokens || 'N/A');
    console.log('✓  All Fields Present:', 
      recipe.title && recipe.category && recipe.ingredients && 
      recipe.instructions && recipe.prepTime && recipe.cookTime ? 'Yes' : 'No'
    );
    
    // Quality assessment
    const ingredientLines = (recipe.ingredients || '').split('\n').filter(l => l.trim()).length;
    const instructionLines = (recipe.instructions || '').split('\n').filter(l => l.trim()).length;
    
    console.log('📋 Ingredient Lines:', ingredientLines);
    console.log('📜 Instruction Steps:', instructionLines);
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ QUALITY ASSESSMENT');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const checks = {
      'Title extracted': !!recipe.title,
      'Category extracted': !!recipe.category,
      'Ingredients extracted': !!recipe.ingredients && ingredientLines >= 5,
      'Instructions extracted': !!recipe.instructions && instructionLines >= 5,
      'Prep time extracted': !!recipe.prepTime,
      'Cook time extracted': !!recipe.cookTime,
      'Response under 10s': parseFloat(responseTime) < 10
    };
    
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(passed ? '✅' : '❌', check);
    });
    
    const passedChecks = Object.values(checks).filter(v => v).length;
    const totalChecks = Object.keys(checks).length;
    const score = ((passedChecks / totalChecks) * 100).toFixed(0);
    
    console.log(`\n⭐ Overall Score: ${passedChecks}/${totalChecks} (${score}%)`);
    
    if (score >= 90) {
      console.log('🎉 Excellent! Feature working as expected.');
    } else if (score >= 70) {
      console.log('👍 Good! Some minor improvements possible.');
    } else if (score >= 50) {
      console.log('⚠️  Fair! Several issues need attention.');
    } else {
      console.log('❌ Poor! Major improvements needed.');
    }
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.error(`\n❌ Error after ${responseTime} seconds:`);
    
    if (error.response) {
      console.error('\n📛 API Response Error:');
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('\n📛 No Response Received:');
      console.error('Request was made but no response received');
      console.error('Possible causes: Network issue, firewall, API down');
    } else {
      console.error('\n📛 Request Setup Error:');
      console.error(error.message);
    }
    
    console.error('\n💡 Troubleshooting:');
    console.error('1. Check GitHub token is valid: github.com/settings/tokens');
    console.error('2. Verify token has required scopes');
    console.error('3. Check internet connection');
    console.error('4. Verify API endpoint is accessible');
    
    process.exit(1);
  }
}

// Run the test
console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║     RECIPE EXTRACTION API TEST - GitHub Models      ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

testExtraction();
