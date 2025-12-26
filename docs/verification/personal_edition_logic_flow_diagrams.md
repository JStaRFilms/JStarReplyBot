# Personal Edition Logic Flow Diagrams

## Overview

This document contains detailed logic flow diagrams for all Personal edition features in JStarReplyBot. These diagrams provide visual representations of how each feature works, the decision points, and the data flow between components.

## Contact Management Flow Diagrams

### 1. Contact Creation and Management Flow

```mermaid
flowchart TD
    A[New Message Received] --> B{Contact Exists?}
    B -->|No| C[Create New Contact]
    B -->|Yes| D[Update Last Contacted]
    
    C --> E[Generate Contact ID]
    E --> F[Set Contact Properties]
    F --> G[Add to Database]
    
    D --> H[Update Contact Timestamp]
    H --> G
    
    G --> I[Check Categories]
    I --> J{Has Categories?}
    J -->|Yes| K[Assign Categories]
    J -->|No| L[Skip Category Assignment]
    
    K --> M[Update Contact in Database]
    L --> M
    M --> N[Update UI Display]
    
    O[User Action: Add Contact] --> P[Validate Contact Data]
    P --> Q[Check for Duplicates]
    Q -->|Exists| R[Show Error Message]
    Q -->|New| S[Create Contact Record]
    S --> T[Save to Database]
    T --> U[Refresh Contact List]
    
    V[User Action: Edit Contact] --> W[Load Contact Data]
    W --> X[Update Contact Properties]
    X --> Y[Validate Changes]
    Y --> Z[Save Updated Contact]
    Z --> AA[Refresh UI]
    
    BB[User Action: Delete Contact] --> CC[Confirm Deletion]
    CC --> DD[Remove from Database]
    DD --> EE[Remove Associated Notes]
    EE --> FF[Update UI]
    
    GG[User Action: Sync WhatsApp] --> HH[Check WhatsApp Connection]
    HH -->|Connected| II[Fetch WhatsApp Contacts]
    HH -->|Not Connected| JJ[Show Connection Error]
    II --> KK[Filter User Contacts]
    KK --> LL[Check for Existing Contacts]
    LL --> MM[Add New Contacts]
    MM --> NN[Update Existing Contacts]
    NN --> OO[Refresh Contact List]
```

### 2. Contact Categorization Flow

```mermaid
flowchart TD
    A[User Opens Categories Panel] --> B[Load Existing Categories]
    B --> C[Display Categories List]
    
    D[User Creates Category] --> E[Validate Category Data]
    E --> F[Generate Category ID]
    F --> G[Set Category Properties]
    G --> H[Save to Database]
    H --> I[Refresh Categories List]
    
    J[User Edits Category] --> K[Load Category Data]
    K --> L[Update Category Properties]
    L --> M[Validate Changes]
    M --> N[Save Updated Category]
    N --> O[Refresh UI]
    
    P[User Deletes Category] --> Q[Confirm Deletion]
    Q --> R[Remove from Database]
    R --> S[Remove from All Contacts]
    S --> T[Refresh UI]
    
    U[User Assigns Categories] --> V[Select Contact]
    V --> W[Select Categories]
    W --> X[Validate Selection]
    X --> Y[Update Contact Categories]
    Y --> Z[Save Changes]
    Z --> AA[Update UI Display]
    
    BB[Batch Category Assignment] --> CC[Parse Input]
    CC --> DD[Validate Categories]
    DD --> EE[Validate Contacts]
    EE --> FF[Process Each Contact]
    FF --> GG[Assign Categories]
    GG --> HH[Track Success/Failure]
    HH --> II[Report Results]
    
    JJ[Category Filtering] --> KK[Get Filter Criteria]
    KK --> LL[Query Contacts by Category]
    LL --> MM[Sort Results]
    MM --> NN[Display Filtered List]
```

### 3. Contact Notes Management Flow

```mermaid
flowchart TD
    A[User Opens Notes Panel] --> B[Load Contact Notes]
    B --> C[Load Personal Notes]
    C --> D[Display Notes Interface]
    
    E[User Creates Note] --> F[Validate Note Data]
    F --> G[Generate Note ID]
    G --> H[Set Note Properties]
    H --> I[Associate with Contact]
    I --> J[Save to Database]
    J --> K[Refresh Notes List]
    
    L[User Edits Note] --> M[Load Note Data]
    M --> N[Update Note Properties]
    N --> O[Validate Changes]
    O --> P[Save Updated Note]
    P --> Q[Refresh UI]
    
    R[User Deletes Note] --> S[Confirm Deletion]
    S --> T[Remove from Database]
    T --> U[Update UI]
    
    V[Note Search] --> W[Get Search Criteria]
    W --> X[Query Notes Database]
    X --> Y[Filter Results]
    Y --> Z[Sort Results]
    Z --> AA[Display Search Results]
    
    BB[Note View Modes] --> CC[Select View Mode]
    CC --> DD{View Mode}
    DD -->|All| EE[Show All Notes]
    DD -->|By Contact| FF[Group by Contact]
    DD -->|By Category| GG[Group by Category]
    
    EE --> HH[Display Notes List]
    FF --> II[Load Contact Groups]
    II --> JJ[Display Grouped Notes]
    GG --> KK[Load Category Groups]
    KK --> LL[Display Grouped Notes]
```

## Mood Detection Flow Diagrams

### 1. Mood Detection Processing Flow

```mermaid
flowchart TD
    A[Message Received] --> B{Mood Detection Enabled?}
    B -->|No| C[Skip Mood Analysis]
    B -->|Yes| D[Preprocess Text]
    
    D --> E[Convert to Lowercase]
    E --> F[Handle Emojis]
    F --> G[Remove Special Characters]
    G --> H[Tokenize Text]
    
    H --> I[Keyword Matching]
    I --> J[Search Happy Keywords]
    J --> K[Search Sad Keywords]
    K --> L[Search Angry Keywords]
    L --> M[Search Other Emotions]
    
    M --> N[Calculate Emotion Scores]
    N --> O[Count Keyword Matches]
    O --> P[Normalize by Message Length]
    P --> Q[Apply Weighting]
    
    Q --> R[Determine Dominant Emotion]
    R --> S[Find Highest Score]
    S --> T[Set Confidence Level]
    
    T --> U[Determine Overall Tone]
    U --> V[Analyze Emotion Mix]
    V --> W[Classify as Positive/Negative/Neutral]
    
    W --> X[Generate Response Suggestions]
    X --> Y[Create Tone Adjustments]
    Y --> Z[Add Contextual Advice]
    
    Z --> AA[Store Mood Profile]
    AA --> BB[Update Contact Profile]
    BB --> CC[Return Detection Results]
    
    DD[Response Generation] --> EE[Get Mood Profile]
    EE --> FF[Get Response Adjustments]
    FF --> GG[Apply Tone Adjustments]
    GG --> HH[Generate Personalized Response]
```

### 2. Mood-Based Response Adjustment Flow

```mermaid
flowchart TD
    A[AI Response Needed] --> B[Get Detected Mood]
    B --> C{Auto-Respond Enabled?}
    C -->|No| D[Use Standard Response]
    C -->|Yes| E[Get Response Guidelines]
    
    E --> F{Emotion Type}
    F -->|Happy| G[Use Enthusiastic Tone]
    F -->|Sad| H[Use Empathetic Tone]
    F -->|Angry| I[Use Calm Tone]
    F -->|Anxious| J[Use Reassuring Tone]
    F -->|Neutral| K[Use Professional Tone]
    
    G --> L[Add Energy Words]
    H --> M[Add Supportive Language]
    I --> N[Use De-escalation Techniques]
    J --> O[Provide Clear Information]
    K --> P[Maintain Standard Tone]
    
    L --> Q[Adjust Response Length]
    M --> Q
    N --> Q
    O --> Q
    P --> Q
    
    Q --> R{Response Length Preference}
    R -->|Short| S[Keep Response Concise]
    R -->|Medium| T[Maintain Balanced Length]
    R -->|Long| U[Provide Detailed Response]
    
    S --> V[Apply Emoji Preferences]
    T --> V
    U --> V
    
    V --> W{Emoji Preference}
    V -->|None| X[Avoid Emojis]
    V -->|Light| Y[Use Minimal Emojis]
    V -->|Moderate| Z[Use Some Emojis]
    V -->|Heavy| AA[Use Many Emojis]
    
    X --> BB[Generate Final Response]
    Y --> BB
    Z --> BB
    AA --> BB
    BB --> CC[Log Response Adjustments]
```

### 3. Mood Profile Management Flow

```mermaid
flowchart TD
    A[New Mood Detection] --> B[Get Contact Profile]
    B --> C{Profile Exists?}
    C -->|No| D[Create New Profile]
    C -->|Yes| E[Update Existing Profile]
    
    D --> F[Initialize Emotion Scores]
    F --> G[Set Initial Values]
    G --> H[Save Profile]
    
    E --> I[Update Emotion Scores]
    I --> J[Apply Decay Factor]
    J --> K[Add New Detection]
    K --> L[Recalculate Averages]
    
    L --> M[Update Last Updated]
    M --> H
    
    H --> N[Check Profile Age]
    N --> O{Profile Too Old?}
    O -->|Yes| P[Apply Data Decay]
    O -->|No| Q[Keep Current Data]
    
    P --> R[Reduce Old Scores]
    R --> S[Remove Very Old Data]
    S --> T[Save Updated Profile]
    
    Q --> T
    T --> U[Return Updated Profile]
    
    V[Profile Analytics] --> W[Aggregate Emotion Data]
    W --> X[Calculate Trends]
    X --> Y[Generate Statistics]
    Y --> Z[Create Visualization Data]
```

## Analytics Flow Diagrams

### 1. Analytics Data Collection Flow

```mermaid
flowchart TD
    A[Message Event Occurs] --> B{Analytics Enabled?}
    B -->|No| C[Skip Tracking]
    B -->|Yes| D[Create Analytics Record]
    
    D --> E[Capture Event Details]
    E --> F[Record Message ID]
    F --> G[Record Direction]
    G --> H[Record Contact Info]
    H --> I[Record Timestamp]
    I --> J[Record Message Length]
    
    J --> K[Calculate Response Time]
    K --> L[Detect Message Mood]
    L --> M[Get Contact Category]
    M --> N[Determine Auto-Reply Status]
    
    N --> O[Calculate Time Saved]
    O --> P[Estimate Manual Response Time]
    P --> Q[Apply Complexity Multiplier]
    Q --> R[Calculate Savings]
    
    R --> S[Update Aggregate Statistics]
    S --> T[Increment Message Count]
    T --> U[Update Response Time Average]
    U --> V[Update Engagement Rate]
    V --> W[Update Mood Distribution]
    
    W --> X[Store Analytics Record]
    X --> Y[Update Database]
    Y --> Z[Notify UI Updates]
    
    AA[Periodic Aggregation] --> BB[Calculate Time Period Stats]
    BB --> CC[Daily Aggregation]
    CC --> DD[Weekly Aggregation]
    DD --> EE[Monthly Aggregation]
    EE --> FF[Update Dashboard]
```

### 2. Analytics Export Flow

```mermaid
flowchart TD
    A[Export Request] --> B[Select Time Period]
    B --> C[Select Export Format]
    C --> D[Retrieve Analytics Data]
    
    D --> E[Filter by Time Period]
    E --> F[Aggregate Statistics]
    F --> G[Format for Export]
    
    G --> H{Export Format}
    H -->|JSON| I[Create JSON Structure]
    H -->|CSV| J[Create CSV Headers]
    
    I --> K[Serialize Data]
    J --> L[Format Rows]
    
    K --> M[Generate Export File]
    L --> M
    
    M --> N[Validate Export Data]
    N --> O[Check File Size]
    O --> P[Write to File System]
    P --> Q[Return File Path]
    
    R[Dashboard Export] --> S[Capture Current View]
    S --> T[Include Filters]
    T --> U[Add Time Range]
    U --> V[Generate Report]
    V --> W[Export with Metadata]
```

### 3. Analytics Display Flow

```mermaid
flowchart TD
    A[User Opens Analytics] --> B[Load Analytics Data]
    B --> C[Check Data Availability]
    C --> D{Has Data?}
    D -->|No| E[Show Empty State]
    D -->|Yes| F[Calculate Metrics]
    
    F --> G[Compute Message Statistics]
    G --> H[Calculate Time Savings]
    H --> I[Compute Engagement Rates]
    I --> J[Analyze Mood Trends]
    J --> K[Identify Peak Usage]
    
    K --> L[Format for Display]
    L --> M[Update Dashboard Widgets]
    M --> N[Render Charts and Graphs]
    
    O[User Changes Settings] --> P[Update Display Options]
    P --> Q{Show Daily?}
    Q -->|Yes| R[Display Daily Stats]
    Q -->|No| S[Hide Daily Stats]
    
    T{Show Weekly?} --> U[Display Weekly Stats]
    T --> V[Hide Weekly Stats]
    
    W{Show Monthly?} --> X[Display Monthly Stats]
    W --> Y[Hide Monthly Stats]
    
    Z[User Filters Data] --> AA[Apply Filter Criteria]
    AA --> BB[Recalculate Metrics]
    BB --> CC[Update Display]
    
    DD[Real-time Updates] --> EE[Listen for Events]
    EE --> FF[Update Live Metrics]
    FF --> GG[Refresh Dashboard]
```

## Personal Context Flow Diagrams

### 1. Context Enrichment Flow

```mermaid
flowchart TD
    A[AI Response Needed] --> B[Get Contact Information]
    B --> C[Retrieve Contact Data]
    C --> D[Get Contact Categories]
    D --> E[Get Contact Notes]
    E --> F[Get Personal Notes]
    
    F --> G[Get Mood Profile]
    G --> H[Get Response Preferences]
    H --> I[Get Conversation History]
    
    I --> J[Build Context Object]
    J --> K[Validate Context Data]
    K --> L[Apply Data Filtering]
    L --> M[Create Context Summary]
    
    M --> N[Enrich AI Prompt]
    N --> O[Add Personal Notes Context]
    O --> P[Add Contact Category Context]
    P --> Q[Add Mood Context]
    Q --> R[Add Response Guidance]
    R --> S[Add Conversation Memory]
    
    S --> T[Format for AI Processing]
    T --> U[Generate Enriched Prompt]
    U --> V[Pass to AI Engine]
    
    W[Context Caching] --> X[Check Cache for Contact]
    X --> Y{Cache Hit?}
    Y -->|Yes| Z[Return Cached Context]
    Y -->|No| AA[Generate New Context]
    AA --> BB[Store in Cache]
    BB --> CC[Set Expiration]
```

### 2. Context Caching Flow

```mermaid
flowchart TD
    A[Context Request] --> B[Generate Cache Key]
    B --> C[Check Cache Storage]
    C --> D{Key Exists?}
    D -->|Yes| E[Check Expiration]
    E --> F{Expired?}
    F -->|Yes| G[Remove Expired Entry]
    F -->|No| H[Return Cached Context]
    
    D -->|No| I[Generate New Context]
    G --> I
    
    I --> J[Store in Cache]
    J --> K[Set Expiration Time]
    K --> L[Return Context]
    
    M[Cache Management] --> N[Monitor Cache Size]
    N --> O{Size Limit Exceeded?}
    O -->|Yes| P[Evict Oldest Entries]
    O -->|No| Q[Continue Normal Operation]
    
    P --> R[Remove Expired Entries]
    R --> S[Update Cache Statistics]
    
    T[Cache Statistics] --> U[Track Hit Rate]
    U --> V[Track Miss Rate]
    V --> W[Track Memory Usage]
    W --> X[Generate Performance Metrics]
```

### 3. Response Personalization Flow

```mermaid
flowchart TD
    A[AI Response Generated] --> B[Get Personal Context]
    B --> C[Analyze Contact Category]
    C --> D{Category Type}
    D -->|Family| E[Use Warm Tone]
    D -->|Friend| F[Use Casual Tone]
    D -->|Colleague| G[Use Professional Tone]
    D -->|Acquaintance| H[Use Polite Tone]
    D -->|General| I[Use Standard Tone]
    
    E --> J[Apply Category Adjustments]
    F --> J
    G --> J
    H --> J
    I --> J
    
    J --> K[Check Personal Notes]
    K --> L{Has Relevant Notes?}
    L -->|Yes| M[Incorporate Note Content]
    L -->|No| N[Skip Note Integration]
    
    M --> O[Check Mood Context]
    N --> O
    
    O --> P{Mood Detected?}
    P -->|Yes| Q[Apply Mood Adjustments]
    P -->|No| R[Skip Mood Adjustments]
    
    Q --> S[Check Response Preferences]
    R --> S
    
    S --> T{Has Preferences?}
    T -->|Yes| U[Apply Preference Settings]
    T -->|No| V[Use Default Settings]
    
    U --> W[Finalize Response]
    V --> W
    
    W --> X[Validate Response Quality]
    X --> Y{Response Appropriate?}
    Y -->|Yes| Z[Return Final Response]
    Y -->|No| AA[Apply Corrections]
    
    AA --> BB[Re-evaluate Response]
    BB --> CC[Ensure Context Integration]
    CC --> Z
```

## Conversation Memory Flow Diagrams

### 1. Memory Storage Flow

```mermaid
flowchart TD
    A[Message Processed] --> B{Memory Enabled?}
    B -->|No| C[Skip Memory Storage]
    B -->|Yes| D[Check Contact Table]
    
    D --> E{Table Exists?}
    E -->|No| F[Create New Table]
    E -->|Yes| G[Use Existing Table]
    
    F --> H[Initialize Table Schema]
    H --> I[Set Table Properties]
    I --> J[Store in Cache]
    
    G --> K[Prepare Message Data]
    K --> L[Generate Embedding]
    L --> M[Create Memory Record]
    
    M --> N[Add Metadata]
    N --> O[Set Timestamp]
    O --> P[Assign Role]
    P --> Q[Store Media Context]
    
    Q --> R[Save to LanceDB]
    R --> S[Update Contact Statistics]
    S --> T[Log Storage Success]
    
    U[Embedding Generation] --> V[Prepare Text]
    V --> W[Call Gemini API]
    W --> X[Receive Vector]
    X --> Y[Validate Embedding]
    Y --> Z[Return to Storage]
    
    AA[Memory Limits] --> BB[Check Message Count]
    BB --> CC{At Limit?}
    CC -->|Yes| DD[Prune Old Messages]
    CC -->|No| EE[Continue Storage]
    
    DD --> FF[Remove Oldest Entries]
    FF --> GG[Update Table]
    GG --> EE
```

### 2. Memory Recall Flow

```mermaid
flowchart TD
    A[Memory Query Needed] --> B[Get Contact Table]
    B --> C{Table Exists?}
    C -->|No| D[Return Empty Results]
    C -->|Yes| E[Prepare Query Text]
    
    E --> F[Generate Query Embedding]
    F --> G[Call LanceDB Search]
    G --> H[Execute Vector Search]
    
    H --> I[Retrieve Top Results]
    I --> J[Sort by Relevance]
    J --> K[Extract Memory Data]
    
    K --> L[Format Results]
    L --> M[Add Relevance Scores]
    M --> N[Include Metadata]
    
    N --> O[Return Memory Results]
    
    P[Query Embedding] --> Q[Preprocess Query]
    Q --> R[Call Gemini API]
    R --> S[Receive Query Vector]
    S --> T[Pass to Search]
    
    U[Search Parameters] --> V[Set Top-K Value]
    V --> W[Set Similarity Threshold]
    W --> X[Configure Search Options]
    X --> Y[Execute Search]
    
    Z[Result Processing] --> AA[Calculate Similarity]
    AA --> BB[Rank by Relevance]
    BB --> CC[Filter Low Scores]
    CC --> DD[Format for Return]
```

### 3. Memory Management Flow

```mermaid
flowchart TD
    A[Memory Maintenance] --> B[Check Storage Usage]
    B --> C[Identify Old Memories]
    C --> D[Calculate TTL Expiry]
    
    D --> E[Prune Expired Memories]
    E --> F[Remove Old Entries]
    F --> G[Update Table Statistics]
    
    G --> H[Check Storage Limits]
    H --> I{At Limit?}
    I -->|Yes| J[Force Pruning]
    I -->|No| K[Continue Monitoring]
    
    J --> L[Remove Additional Entries]
    L --> M[Update Indexes]
    M --> N[Optimize Storage]
    
    O[Manual Cleanup] --> P[User Requests Cleanup]
    P --> Q[Confirm Action]
    Q --> R[Execute Cleanup]
    R --> S[Remove Selected Memories]
    S --> T[Update Statistics]
    
    U[Export Memory] --> V[Select Contact]
    V --> W[Retrieve All Memories]
    W --> X[Format for Export]
    X --> Y[Generate Export File]
    Y --> Z[Return File Path]
    
    AA[Forget Contact] --> BB[Confirm Deletion]
    BB --> CC[Remove Contact Table]
    CC --> DD[Clear Cache Entries]
    DD --> EE[Update Statistics]
    EE --> FF[Log Deletion]
```

## Integration Flow Diagrams

### 1. Feature Interoperability Flow

```mermaid
flowchart TD
    A[Message Processing] --> B[Contact Management]
    B --> C[Mood Detection]
    C --> D[Analytics Tracking]
    D --> E[Personal Context]
    E --> F[Conversation Memory]
    F --> G[AI Response]
    
    G --> H[Response Processing] --> I[Context Enrichment]
    I --> J[Memory Storage]
    J --> K[Analytics Update]
    K --> L[UI Update]
    
    M[Settings Changes] --> N[Feature Validation]
    N --> O[Service Reconfiguration]
    O --> P[Cache Invalidation]
    P --> Q[UI Refresh]
    
    R[User Actions] --> S[Feature Interaction Check]
    S --> T[Conflict Detection]
    T --> U[Resolution Strategy]
    U --> V[Apply Changes]
    
    W[Error Handling] --> X[Error Detection]
    X --> Y[Error Isolation]
    Y --> Z[Graceful Degradation]
    Z --> AA[User Notification]
```

### 2. Data Flow Architecture

```mermaid
flowchart LR
    A[WhatsApp Client] --> B[Message Router]
    B --> C[Contact Service]
    B --> D[Mood Service]
    B --> E[Analytics Service]
    
    C --> F[Database]
    D --> F
    E --> F
    
    G[AI Engine] --> H[Context Service]
    H --> I[Memory Service]
    I --> J[LanceDB]
    
    H --> K[Enrichment Process]
    K --> L[Response Generation]
    
    M[Frontend UI] --> N[Settings Store]
    N --> O[Feature Gating]
    O --> P[Service Configuration]
    
    F --> Q[Data Persistence]
    J --> Q
    P --> Q
```

### 3. Error Recovery Flow

```mermaid
flowchart TD
    A[Error Detected] --> B[Error Classification]
    B --> C{Error Type}
    C -->|Service Error| D[Service Recovery]
    C -->|Database Error| E[Database Recovery]
    C -->|Network Error| F[Network Recovery]
    C -->|User Error| G[User Guidance]
    
    D --> H[Restart Service]
    H --> I[Check Dependencies]
    I --> J[Restore State]
    J --> K[Resume Operations]
    
    E --> L[Check Connection]
    L --> M[Retry Operation]
    M --> N[Use Backup]
    N --> O[Log Error]
    
    F --> P[Wait for Recovery]
    P --> Q[Retry Connection]
    Q --> R[Use Offline Mode]
    R --> S[Notify User]
    
    G --> T[Show Help]
    T --> U[Provide Alternatives]
    U --> V[Log User Action]
    
    K --> W[Verify Recovery]
    O --> W
    S --> W
    V --> W
    
    W --> X{Recovery Successful?}
    X -->|Yes| Y[Continue Processing]
    X -->|No| Z[Escalate Error]
    
    Z --> AA[Show Error Details]
    AA --> BB[Request User Action]
    BB --> CC[Log Incident]
```

These flow diagrams provide comprehensive visual representations of how each Personal edition feature works, the decision points involved, and how the features interact with each other. They serve as valuable references for understanding the system architecture and for debugging issues that may arise during testing or production use.