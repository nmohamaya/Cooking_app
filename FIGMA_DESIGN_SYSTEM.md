# 🎨 Figma Design System - Issue #146

**Issue**: [#146 - Design System & Figma Mockups](https://github.com/nmohamaya/Cooking_app/issues/146)  
**Epic**: [#145 - Beautiful UI Redesign](https://github.com/nmohamaya/Cooking_app/issues/145)  
**Status**: In Progress  
**Last Updated**: January 17, 2026

---

## 📋 Overview

This document guides the creation of the complete Figma design system for MyRecipeApp. It includes:
- Design system setup and components
- Color palette and typography
- Screen mockups for all 6 main features
- Dark mode variants
- Design specifications and handoff guide

---

## 🎯 Objectives

- ✅ Create professional Figma workspace/project
- ✅ Build comprehensive design system with components
- ✅ Design all 6 main screens
- ✅ Create dark mode variants for each screen
- ✅ Document design specifications
- ✅ Prepare assets for development handoff
- ✅ Get team approval on visual direction

---

## 📦 Design System Foundation

### Color Palette

#### Primary Colors (Warm Orange)
```
Primary-100: #FADAB3  (Light)
Primary-200: #F5B98C  (Light-Mid)
Primary-300: #F09965  (Mid)
Primary-400: #E67E22  (Main) ← USE THIS
Primary-500: #D45E0B  (Dark)
Primary-600: #B84200  (Darker)
```

#### Secondary Colors (Fresh Green)
```
Secondary-100: #D5F4E6  (Light)
Secondary-200: #A8E6D9  (Light-Mid)
Secondary-300: #7BD9CC  (Mid)
Secondary-400: #27AE60  (Main) ← USE THIS
Secondary-500: #1B8445  (Dark)
Secondary-600: #0F5A2E  (Darker)
```

#### Accent Colors (Warm Gold)
```
Accent-100:  #FDF3D8  (Light)
Accent-200:  #FCE5AF  (Light-Mid)
Accent-300:  #FBD687  (Mid)
Accent-400:  #F39C12  (Main) ← USE THIS
Accent-500:  #E68910  (Dark)
Accent-600:  #D97F0D  (Darker)
```

#### Neutral Colors
```
Light BG:    #FFF8E7  (Main background)
Light BG-2:  #FFFBF0  (Secondary background)
White:       #FFFFFF  (Pure white)

Dark BG:     #1A1A1A  (Dark mode main)
Dark BG-2:   #242424  (Dark mode secondary)
Dark BG-3:   #2E2E2E  (Dark mode tertiary)

Text Dark:   #2C3E50  (Main text - light mode)
Text Gray:   #5A6C7D  (Secondary text - light mode)
Text Light:  #FFFFFF  (Main text - dark mode)
Text Gray-D: #BDBDBD  (Secondary text - dark mode)
```

#### Status Colors
```
Success:     #27AE60 (Green)
Warning:     #F1C40F (Yellow)
Danger:      #E74C3C (Red)
Info:        #3498DB (Blue)
```

---

## 🔤 Typography System

### Font Families
- **Headers & Titles**: Playfair Display (Bold, 700)
- **Body & UI Text**: Inter (Regular 400, Medium 500, Bold 700)

### Size Scale

#### Desktop (iPad/Web)
```
H1: 40px | Line: 48px | Weight: Bold
H2: 32px | Line: 40px | Weight: Bold
H3: 24px | Line: 32px | Weight: Bold
H4: 20px | Line: 28px | Weight: Bold
Body-L: 18px | Line: 28px | Weight: Regular
Body: 16px | Line: 24px | Weight: Regular
Body-S: 14px | Line: 20px | Weight: Regular
Caption: 12px | Line: 16px | Weight: Regular
```

#### Mobile
```
H1: 32px | Line: 40px | Weight: Bold
H2: 24px | Line: 32px | Weight: Bold
H3: 20px | Line: 28px | Weight: Bold
H4: 18px | Line: 24px | Weight: Bold
Body-L: 16px | Line: 24px | Weight: Regular
Body: 14px | Line: 20px | Weight: Regular
Body-S: 12px | Line: 16px | Weight: Regular
Caption: 11px | Line: 14px | Weight: Regular
```

### Letter Spacing
```
Headers:     -0.5px
Body:        0px
Captions:    0.3px
```

---

## 🎨 Component Library

### Button Components

#### Primary Button
```
State: Default
- Fill: Primary-400 (#E67E22)
- Text: White (#FFFFFF), Body, Bold
- Padding: 12px 24px (mobile), 16px 32px (desktop)
- Border Radius: 8px
- Shadow: 0px 2px 8px rgba(0,0,0,0.1)

State: Hover
- Fill: Primary-500 (#D45E0B)
- Shadow: 0px 4px 12px rgba(230,126,34,0.3)

State: Pressed
- Fill: Primary-600 (#B84200)

State: Disabled
- Fill: #CCCCCC
- Text: #999999
- Opacity: 0.6
```

#### Secondary Button
```
State: Default
- Border: 2px Secondary-400 (#27AE60)
- Text: Secondary-400, Body, Bold
- Fill: Transparent
- Padding: 12px 24px

State: Hover
- Fill: Secondary-100 (#D5F4E6)

State: Pressed
- Fill: Secondary-200 (#A8E6D9)
```

#### Ghost Button
```
- No border or fill
- Text: Primary-400
- Text Style: Body, Bold
- Hover: Text: Primary-500, Add shadow
```

### Card Components

#### Recipe Card
```
Dimensions: 180px W x 240px H (mobile), 240px W x 300px H (desktop)
Corner Radius: 12px
Shadow: 0px 2px 12px rgba(0,0,0,0.08)
Shadow Hover: 0px 8px 24px rgba(0,0,0,0.15)

Structure:
┌─────────────────────────┐
│  Recipe Image (16:20)   │  ← Image with gradient overlay
├─────────────────────────┤
│ Recipe Title (H4)       │  ← Bold, 2 lines max
│ ⭐ 4.5 (120)            │  ← Rating + count
│ 45 min • Intermediate   │  ← Cook time + difficulty
└─────────────────────────┘
```

#### Feature Card
```
Dimensions: Full width (mobile), 280px W (desktop)
Corner Radius: 12px
Padding: 16px
Shadow: 0px 2px 12px rgba(0,0,0,0.08)
Fill: Light BG

Contains:
- Icon (48px, Accent-400)
- Title (H4, Bold)
- Description (Body-S, Text Gray)
- Optional CTA button
```

### Input Components

#### Text Input
```
Height: 48px (mobile), 56px (desktop)
Padding: 12px 16px
Border: 1px solid #E0E0E0
Border Radius: 8px
Fill: White
Font: Body, Regular

State: Focus
- Border: 2px Primary-400
- Shadow: 0px 0px 0px 4px rgba(230,126,34,0.1)

State: Filled
- Fill: Light BG

State: Error
- Border: 2px Danger (#E74C3C)
- Helper text: Danger color
```

#### Search Input
```
Height: 44px
Padding: 8px 16px 8px 44px
Icon: Feather Search (24px, left)
Border Radius: 24px
Fill: Light BG-2
Border: 1px Light BG

Placeholder: "Search recipes..."
Font: Body-S, Text Gray
```

### Modal & Sheet Components

#### Modal
```
Overlay: rgba(0,0,0,0.4)
Content Background: White
Corner Radius: 16px
Shadow: 0px 20px 60px rgba(0,0,0,0.3)

Padding: 24px
Max Width: 500px (mobile full width - 32px)

Header:
- Title: H3, Bold
- Close Icon: Top right

Body: Custom content

Footer:
- Action buttons at bottom
```

#### Bottom Sheet
```
Dimensions: Full width
Border Radius: 20px (top only)
Shadow: 0px -4px 16px rgba(0,0,0,0.1)
Padding: 24px
Fill: White

Handle Bar: 
- Width: 40px, Height: 4px
- Color: #E0E0E0
- Radius: 2px
- Centered at top

Swipe to dismiss gesture support
```

---

## 📱 Screen Mockups

### 1. Home/Feed Screen

**Key Elements:**
```
┌──────────────────────────────┐
│  MyRecipeApp      🔍   👤   │  ← Header with search & profile
├──────────────────────────────┤
│ 🔥 Trending  🥗 New  📅 Saved│  ← Filter tabs
├──────────────────────────────┤
│  ┌──────────────┐            │
│  │ Recipe Card  │ ← Scrollable grid
│  │  (2 columns) │
│  └──────────────┘
│  ┌──────────────┐
│  │ Recipe Card  │
│  └──────────────┘
│
│           + (FAB)             │  ← Floating Action Button
└──────────────────────────────┘
```

**Components:**
- Hero section with featured recipe
- Searchable recipe grid (2 columns mobile, 3+ desktop)
- Filter/sort tabs
- Pull-to-refresh animation
- Floating action button for new recipe
- Navigation bar at bottom

**Assets Needed:**
- Header background
- Recipe placeholder images
- Icon set for filters
- FAB icon

---

### 2. Recipe Detail Screen

**Key Elements:**
```
┌──────────────────────────────┐
│          ← Back              │
├──────────────────────────────┤
│  Large Recipe Image          │  ← Parallax effect
│  (full width, 4:3 ratio)     │
├──────────────────────────────┤
│ Recipe Title          ❤️ ⬆️  │
│ ⭐ 4.5 (120)                 │
│ 🕐 45 min • 4 servings       │
├──────────────────────────────┤
│ Ingredients:                 │
│ ☑ 2 cups flour          +🛒 │
│ ☐ 1 cup sugar           +🛒 │
│ ☐ 3 eggs                +🛒 │
├──────────────────────────────┤
│ Instructions:                │
│ 1️⃣ Mix dry ingredients...   │
│ 2️⃣ Add wet ingredients...   │
├──────────────────────────────┤
│ Nutrition Facts              │
│ Calories: 245 | Protein: 5g  │
├──────────────────────────────┤
│ Reviews                      │
│ ⭐⭐⭐⭐ "Amazing recipe" │
└──────────────────────────────┘
```

**Components:**
- Parallax scrolling header image
- Title with heart favorite button
- Rating and stats badges
- Ingredient list with checkboxes
- "Add to Shopping List" buttons
- Step-by-step instructions
- Nutrition information card
- User reviews section
- Share/print buttons

---

### 3. Shopping List Screen

**Key Elements:**
```
┌──────────────────────────────┐
│ Shopping List    ☰ ≡         │  ← Header with sort
├──────────────────────────────┤
│ Filter: All  Produce  Dairy  │
├──────────────────────────────┤
│ PRODUCE                      │
│ ☑ 2 Tomatoes          $1.99 │
│ ☐ 1 Cucumber          $0.89 │
│ ☐ 3 Bell Peppers      $4.47 │
├──────────────────────────────┤
│ DAIRY                        │
│ ☑ Milk (1L)           $2.49 │
│ ☐ Cheese              $5.99 │
├──────────────────────────────┤
│ Total: $15.83                │
│                              │
│ [Share] [Print] [Buy Now 🛍] │
└──────────────────────────────┘
```

**Components:**
- Searchable/filterable list
- Organized by category
- Checkbox for completed items
- Price per item (if available)
- Total cost calculator
- Swipe-to-delete gesture
- Share and print options
- "Buy now" integration option

---

### 4. Meal Planner Screen

**Key Elements:**
```
┌──────────────────────────────┐
│ Meal Planner     < Jan 2026 >│
├──────────────────────────────┤
│ Su  Mo  Tu  We  Th  Fr  Sa   │
│  5   6   7   8   9  10  11   │
│    ⭕ 🟢                      │  ← Selected day highlight
├──────────────────────────────┤
│ Friday, January 10           │
├──────────────────────────────┤
│ BREAKFAST                    │
│ 🥞 Pancakes     ❌           │
│                              │
│ LUNCH                        │
│ 🥗 Caesar Salad  ❌          │
│ + Add Meal                   │
│                              │
│ DINNER                       │
│ 🍝 Pasta       ❌            │
│ + Add Meal                   │
├──────────────────────────────┤
│ [Gen. Shopping List] [Save]  │
└──────────────────────────────┘
```

**Components:**
- Monthly/weekly calendar view
- Day-by-meal-type layout
- Meal type badges (Breakfast, Lunch, Dinner, Snacks)
- Drag-and-drop recipe selection
- Quick "Add Meal" button
- Remove button for each meal
- Generate shopping list from meal plan

---

### 5. User Profile Screen

**Key Elements:**
```
┌──────────────────────────────┐
│ Profile               Settings│
├──────────────────────────────┤
│        👤 Avatar             │
│    John Doe (Edit)           │
│   Home chef • San Francisco   │
├──────────────────────────────┤
│ Recipes: 12  Followers: 42   │
├──────────────────────────────┤
│ My Recipes                   │
│ 🍰 Chocolate Cake    (8 likes)│
│ 🍪 Sugar Cookies    (12 likes)│
│ [View All →]                 │
├──────────────────────────────┤
│ Settings:                    │
│ 🍽 Dietary Preferences       │
│ 🌙 Dark Mode           [🟢]  │
│ 🔔 Notifications       [🟢]  │
│ 📱 App Version: 1.0.0        │
│ ❓ Help & Support            │
│ [Sign Out]                   │
└──────────────────────────────┘
```

**Components:**
- Profile avatar (editable)
- User info section
- Stats display (recipes, followers)
- My recipes section
- Favorite recipes grid
- Settings toggles
- Dark mode toggle
- App version and links
- Sign out button

---

### 6. Cost Monitoring Dashboard

**Key Elements:**
```
┌──────────────────────────────┐
│ Cost Monitor        [Jan 2026]│
├──────────────────────────────┤
│ Monthly Spending             │
│ ┌────────────────────────┐   │
│ │                        │   │  ← Large spending amount
│ │      $47.32 / $100     │   │  ← Budget bar
│ │      47% Used  🟢       │   │
│ └────────────────────────┘   │
├──────────────────────────────┤
│ Daily Breakdown (Bar Chart)  │
│ |░░░░░░░░░░░░░░░░░░|        │
│ Mon Tue Wed Thu Fri          │
│  1.2  2.4  3.1  1.8  4.5     │
├──────────────────────────────┤
│ By Service                   │
│ 🎬 Transcription:    $25.00   │
│ 📖 Recipe Extract:   $15.20   │
│ 📥 Downloads:         $7.12   │
├──────────────────────────────┤
│ Daily Limit: $3.33            │
│ Monthly Limit: $100.00        │
│ [Save Settings]              │
└──────────────────────────────┘
```

**Components:**
- Large spending display with percentage
- Budget progress bar (color changes: green → yellow → red)
- Daily spending bar chart
- Service breakdown pie/bar chart
- Cost history list
- Budget settings
- Alert system (75% warning, 90% critical)
- Date range filter

---

## 🌙 Dark Mode Variants

### Dark Mode Rules
```
Light BG   → Dark BG   (#FFF8E7 → #1A1A1A)
White      → Dark BG-3 (#FFFFFF → #2E2E2E)
Text Dark  → Text Light (#2C3E50 → #FFFFFF)
Text Gray  → Text Gray-D (#5A6C7D → #BDBDBD)
```

### Component Adjustments for Dark Mode

**Cards:**
- Background: Dark BG-2 (#242424)
- Shadow: Lighter (0px 2px 12px rgba(255,255,255,0.05))
- Text: Text Light

**Inputs:**
- Background: Dark BG-3 (#2E2E2E)
- Border: #404040
- Text: Text Light
- Placeholder: Text Gray-D

**Images:**
- Add 0.2 opacity dark overlay to maintain text readability

---

## 📐 Spacing & Layout

### Spacing Scale (8px base)
```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
xxl: 48px
```

### Container Padding
```
Mobile:  16px
Tablet:  24px
Desktop: 32px
```

### Grid System
```
Mobile:  1 column (full width - padding)
Tablet:  2 columns (with gap: 16px)
Desktop: 3+ columns (with gap: 24px)
```

---

## 🎬 Animation Specifications

### Micro-interactions
```
Tap Button:     Scale 0.95, 100ms ease-out
Hover Card:     Lift 4px, Shadow increase, 200ms ease-out
Swipe Delete:   Slide-out 200ms, Fade 150ms
Loading Spinner: 360° rotate, 2s linear infinite
Scroll Parallax: Image zoom 1.1x over 2x scroll distance
```

### Transitions
```
Color Changes:      200ms ease-in-out
Size Changes:       150ms cubic-bezier(0.4, 0, 0.2, 1)
Position Changes:   200ms cubic-bezier(0.4, 0, 0.2, 1)
Opacity Changes:    150ms ease-in
```

---

## 📊 Responsive Breakpoints

```
Mobile:  320px - 479px
Tablet:  480px - 1023px
Desktop: 1024px+
```

### Screen-Specific Adjustments

**Mobile:**
- Single column layouts
- Larger touch targets (44px minimum)
- Full-width cards
- Bottom navigation

**Tablet:**
- Two column layouts
- Landscape support
- Larger fonts (readable from distance)

**Desktop:**
- Multi-column grids
- Larger spacing
- Hover effects enabled

---

## 🎯 Design Handoff Checklist

### Figma Setup
- [ ] Workspace created
- [ ] Design system components built
- [ ] All 6 screens designed
- [ ] Dark mode variants created
- [ ] Assets exported (PNGs, SVGs)
- [ ] Icon library set up
- [ ] Typography styles defined
- [ ] Color styles defined

### Documentation
- [ ] Design specs documented
- [ ] Animation timings noted
- [ ] Responsive breakpoints tested
- [ ] Accessibility considerations noted
- [ ] Design tokens exported
- [ ] Component library published

### Team Review
- [ ] Stakeholder feedback received
- [ ] Design approved
- [ ] Developer questions answered
- [ ] Design assets shared with dev team

### Handoff
- [ ] Figma link shared with developers
- [ ] Assets downloaded and organized
- [ ] Design guide provided
- [ ] Weekly design sync scheduled

---

## 📚 Resources & Tools

### Figma Plugins
- **Figma to React**: Auto-generate React components
- **Design Lint**: Find inconsistent or missing styles in your design system
- **Stark**: Accessibility and contrast checking (WCAG compliance)
- **Design QA**: Quality assurance checks
- **Unsplash**: Stock images

### Icon Libraries
- **Feather Icons**: https://feathericons.com
- **Ionicons**: https://ionicons.com
- **Material Icons**: https://fonts.google.com/icons

### Color Tools
- **Figma Color Palette Generator**: Built-in
- **Coolors.co**: Palette inspiration
- **Contrast Checker**: WCAG compliance

### Inspiration
- **Dribbble**: UI design inspiration
- **UI8**: Design resources
- **Component Gallery**: Component examples

---

## ✅ Acceptance Criteria - Issue #146

- [ ] Figma workspace created and shared with team
- [ ] Color palette defined with all variants
- [ ] Typography system set up with all sizes
- [ ] Component library created (buttons, cards, inputs, etc.)
- [ ] All 6 main screens designed (Home, Recipe Detail, Shopping List, Meal Planner, Profile, Cost Monitor)
- [ ] Dark mode variants for all screens
- [ ] Design specs documented (spacing, animations, responsive)
- [ ] Assets exported and organized (SVGs, PNGs)
- [ ] Icon set integrated (Feather Icons)
- [ ] Figma link shared with development team
- [ ] Design guide/handoff document created
- [ ] Team review and approval received
- [ ] No console errors/warnings in design
- [ ] All screens responsive tested (mobile, tablet, desktop)
- [ ] Ready for development handoff

---

## 📝 Implementation Notes

### Getting Started

1. **Create Figma Account**
   - Go to https://figma.com
   - Sign up with email or GitHub
   - Create new file "MyRecipeApp Design System"

2. **Set Up Base Workspace**
   - Create pages for each screen
   - Set up team library
   - Configure design tokens

3. **Build Color System**
   - Create color swatches
   - Name and organize systematically
   - Test contrast ratios (WCAG AA)

4. **Define Typography**
   - Add font libraries
   - Create text styles
   - Test readability at all sizes

5. **Create Components**
   - Build reusable button variants
   - Create card templates
   - Build input states
   - Set up modal structures

6. **Design Screens**
   - Start with Home/Feed
   - Use existing components
   - Maintain consistency
   - Add interactions

7. **Add Dark Mode**
   - Duplicate screens
   - Apply dark colors
   - Test contrast/readability
   - Document differences

8. **Export & Share**
   - Export assets
   - Create design guide
   - Share Figma file
   - Schedule design review

---

## 🔄 Next Steps

After Issue #146 (Design System) is complete:

1. **Issue #147** - Install NativeBase & Dependencies
2. **Issue #148** - Create Custom Theme & Colors
3. **Issues #149-154** - Implement screen UIs
4. **Issue #155** - Add animations
5. **Issue #156** - Dark mode support
6. **Issues #157-158** - Testing and polish

---

**Last Updated**: January 17, 2026  
**Figma Link**: TBD (to be added after creation)  
**Design Lead**: TBD  
**Status**: Ready to Start

Let's create something beautiful! 🎨✨
