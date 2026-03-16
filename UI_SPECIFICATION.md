# Personal Finance App - UI Specification

## 1. Navigation & Layout

### Bottom Navigation
- **Fixed bottom navigation bar** with two tabs:
  - **Home/Dashboard**: Main transaction view
  - **Settings**: Configuration and management panels
- **Mobile-first design**: Optimized for mobile with responsive scaling
- **PWA Support**: Install prompts for "Add to Home Screen" on iOS/Android

## 2. Wallet Management

### Wallet Features
- **Wallet CRUD**: Create, read, update, delete wallets
- **Wallet Icon Selection**: Emoji/icon picker for each wallet
- **Wallet Balance Display**: Shows current balance without currency symbols
- **Wallet Selector Dropdown**: 
  - Displays all available wallets
  - Shows wallet icons and names
  - Indicates default wallet with "(default)" label

### Wallet Groups
- **Wallet Group CRUD**: Create groups to organize wallets
- **Group Selection**: Select a group to view aggregated transactions
- **Group Display**: Shows all wallets belonging to the group
- **Transactions by Group**: When group selected, shows transactions from ALL wallets in that group

### Default Wallet
- **Per-User Default**: Each user can have a default wallet
- **Auto-Selection**: Default wallet is pre-selected on app load
- **Settings Configuration**: Set default wallet in Settings panel

## 3. Category Management

### Category Structure
- **Hierarchical Tree**: Unlimited nesting levels (parent → child → grandchild)
- **Category CRUD**: Create, read, update, delete categories
- **Parent Selection**: When creating/editing, can select any category as parent
- **Root Categories**: Special root categories (Income, Expense) with IDs

### Category Display
- **Visual Indentation**: Child categories are indented under parents
- **Expand/Collapse**: Toggle to show/hide subcategories
- **Category Icons**: Each category has an associated emoji/icon
- **Icon & Name Display**: Both shown in all category lists

### Category Caching
- **LocalStorage Caching**: Categories cached per wallet
- **Background Refresh**: Cache refreshes automatically after CRUD operations
- **Search Filter**: Real-time search by category name
- **Search Behavior**: 
  - Filters categories by name match
  - Shows matching parent with expand option to reveal children
  - When parent matches search, children become visible via expand button

## 4. Transaction Management

### Transaction List View

#### Period Filtering (with Persistence)
- **Period Types**: ALL, Daily, Weekly, Monthly, Yearly, Custom
- **Period Persistence**: Selected period saved across sessions
- **Smart Defaults**:
  - Daily/Weekly/Monthly/Yearly: Shows CURRENT period (today, this week, etc.)
  - ALL: Shows all transactions for selected wallet
  - Custom: Preserves selected date range

#### Period Labels
- **Daily View Special**: Shows "Today" or "Yesterday" labels before actual date
- **Date Format**: Human-readable format (MMM d, h:mm a)

#### Transaction Display
Each transaction item shows:
- **Category Icon**: Colored background (income=green, expense=red)
- **Category Name**: Primary text
- **Note or Payee**: Secondary text (note preferred, fallback to person_name)
- **Transaction Datetime**: When transaction occurred
- **Modified Datetime**: Last edit time (very small, muted text)
- **Entry Datetime**: Hidden, used for secondary sorting
- **Amount**: 
  - No currency symbols
  - Income: Green with "+" prefix
  - Expense: Red with "-" prefix
  - Two decimal places

### Transaction Sorting
- **Sort Options**:
  1. **Transaction Date**: Primary sort by transaction_time
  2. **Entry Date**: Sort by when record was created (entry_time)
  3. **Category**: Group by category alphabetically
- **Secondary Sort**: When primary sort values equal, uses entry_time
- **Category Grouping**: When sorted by category:
  - Groups transactions under category headers
  - Shows total amount per category beside category name

### Transaction Search
- **Expandable Search**: Icon expands to text input on click
- **Search Fields**: Matches against:
  - Transaction notes
  - Category name
  - Transaction datetime
- **Real-time Filtering**: Results update as user types

### Transaction Caching
- **LocalStorage Cache**: Transactions cached per wallet + period combination
- **Show Cache First**: Displays cached data immediately on load
- **Background Sync**: Fetches fresh data in background, updates if changed
- **Periodic Sync**: Auto-refresh every 60 seconds

## 5. Transaction Dialog (Create/Edit)

### Dialog Behavior
- **Entry Trigger**: 
  - Mobile: Long-press (400ms) on transaction item
  - Desktop: Right-click on transaction item
  - Plus button for new transaction
- **Back Button Handling**: Pressing back closes dialog instead of exiting app
- **Keyboard Handling**: Dialog positioned at TOP of screen to avoid keyboard overlap
- **Exit Confirmation**: Separate dialog confirms app exit on back button

### Form Fields (Top to Bottom)
1. **Amount Input** (Auto-focused)
   - Numeric input
   - No currency symbol
   - Thin/compact styling
   - First field focused on open

2. **Category Picker**
   - Button showing current category
   - Opens category selection dialog
   - Thinner padding for compactness
   - Shows "Select Category" if none selected

3. **Transaction Datetime**
   - Date and time picker
   - Remembers last used datetime for next transaction
   - Persists across sessions

4. **Note Field** (Above Person)
   - Text input for transaction notes
   - Full width

5. **Person/Payee**
   - Text input for payee name
   - Below note field

6. **Wallet Selection**
   - Dropdown to select wallet
   - Defaults to selected wallet

### Category Selection Dialog (within Transaction Dialog)
- **Positioned at Top**: Dialog opens at top of screen
- **Search Bar**: Real-time category filtering at top
- **Hierarchical Display**: Tree view with expand/collapse
- **Compact Items**: Thinner rows to fit more categories
- **Selection**: Click to select, click again to deselect
- **Search with Children**: When parent matches search, expand button reveals children

### Action Buttons
- **Save Button**: Same size as delete button, not thinner
- **Delete Button**: For existing transactions
- **Cancel**: Closes dialog

## 6. Settings Panel

### Layout
- **Collapsible Sections**: Each section can expand/collapse
- **Scrollable Area**: Max height with overflow scrolling
- **Card-Based Design**: Each section in a card container

### Sections (in order)

1. **Default Wallet**
   - Wallet selector dropdown
   - Shows current default indicator
   - "Set as Default" button
   - Only enabled when different wallet selected

2. **Wallets** (Collapsible)
   - Expand to show Wallet Manager
   - Create new wallet
   - Edit existing wallets
   - Delete wallets

3. **Wallet Groups** (Collapsible)
   - Expand to show Wallet Group Manager
   - Create groups
   - Assign wallets to groups
   - Delete groups

4. **Categories** (Collapsible)
   - Expand to show Category Manager
   - Full category tree management
   - Create, edit, delete categories
   - Reorganize hierarchy

5. **Active User**
   - User selector dropdown
   - Shows user name and email
   - Changes active user for transactions

6. **Install App**
   - PWA install instructions
   - iOS: Share → Add to Home Screen
   - Android: Menu → Add to Home Screen

7. **Current Session**
   - Displays:
     - Current user name
     - Current wallet name
     - Current balance (no currency symbol)

## 7. Data Persistence & Caching

### Cached Data (LocalStorage)
1. **Categories**: Per-wallet category tree
2. **Transactions**: Per-wallet + period combination
3. **Default Wallet**: Per-user default wallet ID
4. **Period Selection**: Last selected period type and custom dates
5. **Last Transaction Time**: Remembered for new transactions

### Cache Refresh Strategy
- **Immediate Display**: Show cached data first
- **Background Refresh**: Update cache after displaying
- **CRUD Triggers**: Refresh relevant cache after create/update/delete
- **Periodic Sync**: Auto-refresh every minute for active data

## 8. UI Design System

### Colors (No Direct Colors - Use Design Tokens)
- **Primary**: Brand color for buttons, icons
- **Income**: Green tone for positive amounts
- **Expense**: Red tone for negative amounts
- **Background**: Page background
- **Card**: Elevated card surfaces
- **Muted**: Secondary/subdued text
- **Foreground**: Primary text

### Typography
- **No Currency Symbols**: All amounts plain numbers
- **Compact Sizing**: Small text for dense information
- **Date Stamps**: Extra small (8px) for modified times
- **Hierarchy**: Clear visual hierarchy with size variation

### Spacing & Layout
- **Compact Design**: Reduced padding to fit more content
- **Thin Inputs**: Minimal vertical padding
- **Card Shadows**: Subtle elevation for cards
- **Rounded Corners**: Consistent border radius throughout

## 9. Responsive Behavior

### Mobile (Primary)
- **Bottom Navigation**: Fixed at bottom
- **Full-Screen Dialogs**: Transaction dialog at top
- **Touch Interactions**: Long-press for edit
- **Compact Lists**: Minimal spacing between items

### Desktop
- **Right-Click Edit**: Context menu behavior
- **Expanded Layout**: More horizontal space utilization
- **Hover States**: Visual feedback on hover

## 10. Key Interactions Summary

| Action | Mobile | Desktop |
|--------|--------|---------|
| Edit Transaction | Long-press 400ms | Right-click |
| Navigate | Bottom tabs | Bottom tabs |
| Search | Tap icon → expands | Tap icon → expands |
| Back Button | Closes popup first | Closes popup first |
| Category Select | Top-positioned dialog | Top-positioned dialog |
| Wallet/Category CRUD | In Settings collapsibles | In Settings collapsibles |

## 11. Data Display Rules

### Amounts
- **NO currency symbols** anywhere
- **Two decimal places** always shown
- **Color coding**: Green income, Red expense
- **Sign prefix**: + for income, - for expense

### Dates
- **Transaction Date**: Main display date
- **Modified Date**: Tiny text, muted color
- **Entry Date**: Hidden, used for sorting only
- **Daily View**: "Today"/"Yesterday" labels

### Categories
- **Icon + Name** always shown together
- **Hierarchy**: Visual indentation for children
- **Totals**: Sum shown when grouped by category
