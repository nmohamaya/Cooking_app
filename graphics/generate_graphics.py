#!/usr/bin/env python3
"""
Google Play Store Graphics Generator

Generates placeholder graphics for MyRecipeApp Play Store listing.
This script creates:
- App icon (512x512)
- Feature graphic (1024x500)
- Screenshots (1080x1920)

Usage:
    python graphics/generate_graphics.py

Output:
    graphics/app_icon_512x512.png
    graphics/feature_graphic_1024x500.png
    graphics/screenshot_*.png

Note:
    These are placeholder graphics for testing/development.
    Use professional designs for actual Play Store submission.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create graphics directory if it doesn't exist
os.makedirs('graphics', exist_ok=True)

# Brand colors
COLOR_PRIMARY_ORANGE = (255, 107, 53)  # #FF6B35
COLOR_PRIMARY_GREEN = (0, 78, 137)     # #004E89
COLOR_ACCENT_BLUE = (26, 127, 127)     # #1A7F7F
COLOR_LIGHT_ORANGE = (255, 230, 109)   # #FFE66D
COLOR_LIGHT_GRAY = (245, 245, 245)     # #F5F5F5
COLOR_DARK_GRAY = (51, 51, 51)         # #333333
COLOR_WHITE = (255, 255, 255)

def draw_rounded_rectangle(draw, xy, radius=20, fill=None, outline=None, width=1):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = xy
    draw.rectangle([x1+radius, y1, x2-radius, y2], fill=fill, outline=outline, width=width)
    draw.rectangle([x1, y1+radius, x2, y2-radius], fill=fill, outline=outline, width=width)
    draw.ellipse([x1, y1, x1+radius*2, y1+radius*2], fill=fill, outline=outline, width=width)
    draw.ellipse([x2-radius*2, y1, x2, y1+radius*2], fill=fill, outline=outline, width=width)
    draw.ellipse([x1, y2-radius*2, x1+radius*2, y2], fill=fill, outline=outline, width=width)
    draw.ellipse([x2-radius*2, y2-radius*2, x2, y2], fill=fill, outline=outline, width=width)

def generate_app_icon():
    """Generate app icon 512x512."""
    img = Image.new('RGBA', (512, 512), COLOR_WHITE)
    draw = ImageDraw.Draw(img)
    
    # Background gradient effect with circles
    draw.ellipse([0, 0, 512, 512], fill=COLOR_PRIMARY_GREEN)
    draw.ellipse([100, 100, 412, 412], fill=COLOR_PRIMARY_ORANGE)
    
    # Draw fork and spoon icon
    # Fork tines
    draw.line([(180, 200), (180, 350)], fill=COLOR_WHITE, width=15)
    draw.line([(240, 200), (240, 350)], fill=COLOR_WHITE, width=15)
    draw.line([(300, 200), (300, 350)], fill=COLOR_WHITE, width=15)
    
    # Fork handle
    draw.line([(240, 350), (240, 420)], fill=COLOR_WHITE, width=20)
    
    # Spoon
    draw.ellipse([(330, 180), (400, 250)], fill=COLOR_LIGHT_ORANGE, outline=COLOR_WHITE, width=2)
    draw.line([(365, 250), (365, 420)], fill=COLOR_WHITE, width=20)
    
    img.save('graphics/app_icon_512x512.png')
    print("✅ Created: graphics/app_icon_512x512.png")

def generate_feature_graphic():
    """Generate feature graphic 1024x500."""
    img = Image.new('RGB', (1024, 500), COLOR_LIGHT_GRAY)
    draw = ImageDraw.Draw(img)
    
    # Background with gradient colors
    for y in range(500):
        ratio = y / 500
        r = int(COLOR_PRIMARY_GREEN[0] * (1 - ratio) + COLOR_ACCENT_BLUE[0] * ratio)
        g = int(COLOR_PRIMARY_GREEN[1] * (1 - ratio) + COLOR_ACCENT_BLUE[1] * ratio)
        b = int(COLOR_PRIMARY_GREEN[2] * (1 - ratio) + COLOR_ACCENT_BLUE[2] * ratio)
        draw.line([(0, y), (1024, y)], fill=(r, g, b))
    
    # Draw decorative circles
    draw.ellipse([50, 50, 250, 250], fill=COLOR_PRIMARY_ORANGE, outline=COLOR_WHITE, width=3)
    draw.ellipse([750, 250, 950, 450], fill=COLOR_LIGHT_ORANGE, outline=COLOR_WHITE, width=3)
    
    # Text
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    draw.text((150, 180), "MyRecipeApp", fill=COLOR_WHITE, font=font_large)
    draw.text((150, 260), "AI-Powered Recipe Management", fill=COLOR_LIGHT_ORANGE, font=font_small)
    
    img.save('graphics/feature_graphic_1024x500.png')
    print("✅ Created: graphics/feature_graphic_1024x500.png")

def generate_screenshot(num, title, subtitle, accent_color):
    """Generate screenshot 1080x1920."""
    img = Image.new('RGB', (1080, 1920), COLOR_LIGHT_GRAY)
    draw = ImageDraw.Draw(img)
    
    # Status bar (dark)
    draw.rectangle([0, 0, 1080, 80], fill=COLOR_DARK_GRAY)
    
    # Header
    draw.rectangle([0, 80, 1080, 200], fill=accent_color)
    
    # Main content area (white)
    draw.rectangle([0, 200, 1080, 1920], fill=COLOR_WHITE)
    
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
        font_subtitle = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
        font_text = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_text = ImageFont.load_default()
    
    # Time in status bar
    draw.text((50, 20), "9:41", fill=COLOR_WHITE, font=font_title)
    
    # Header text
    draw.text((50, 100), "MyRecipeApp", fill=COLOR_WHITE, font=font_title)
    
    # Main title
    draw.text((50, 250), title, fill=accent_color, font=font_title)
    draw.text((50, 330), subtitle, fill=COLOR_DARK_GRAY, font=font_subtitle)
    
    # Content boxes
    box_y = 450
    for i in range(3):
        draw.rectangle([50, box_y, 1030, box_y + 150], 
                      fill=COLOR_LIGHT_GRAY, outline=accent_color, width=2)
        draw.text((80, box_y + 40), f"Feature {i+1}", 
                 fill=COLOR_DARK_GRAY, font=font_text)
        box_y += 180
    
    # Bottom button
    draw.rectangle([150, 1750, 930, 1850], fill=accent_color)
    draw.text((450, 1770), "Get Started", fill=COLOR_WHITE, font=font_subtitle)
    
    img.save(f'graphics/screenshot_{num}_1080x1920.png')
    print(f"✅ Created: graphics/screenshot_{num}_1080x1920.png")

def main():
    print("\n🎨 Generating MyRecipeApp Graphics...")
    print("=" * 50)
    
    generate_app_icon()
    generate_feature_graphic()
    
    generate_screenshot(1, "AI Recipe Extraction", "Convert any recipe text instantly", COLOR_PRIMARY_ORANGE)
    generate_screenshot(2, "Multi-Timer Widget", "Manage multiple cooking timers", COLOR_ACCENT_BLUE)
    generate_screenshot(3, "Recipe Management", "Organize all your recipes", COLOR_PRIMARY_GREEN)
    
    print("=" * 50)
    print("✅ All graphics generated successfully!")
    print("\n📁 Graphics created in: graphics/")
    print("\n⚠️  Note: These are placeholder graphics for testing.")
    print("   Use professional designs for actual Play Store submission.")
    print("\n📖 See graphics/GRAPHICS_SPECIFICATIONS.md for requirements.\n")

if __name__ == '__main__':
    main()
