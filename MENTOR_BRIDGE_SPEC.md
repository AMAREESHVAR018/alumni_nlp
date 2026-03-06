# Mentor Bridge: NLP-Based Intelligent Alumni–Student Chat System

## 1. Problem Statement

Students often struggle to obtain reliable career guidance, real-world industry insights, and internship opportunities. Although AI tools and online resources provide vast theoretical knowledge, they lack practical industry experience and personalized mentorship from professionals currently working in the field.

Alumni can provide valuable insights because they have both academic experience from the same institution and real-world industry exposure. However, alumni often receive repetitive questions from multiple students, which leads to inefficiency and reduced willingness to participate actively in mentorship.

Additionally, students face difficulty in finding the right alumni based on company, role, graduation year, or domain, and there is no unified system that intelligently manages mentorship queries.

Therefore, there is a need for an intelligent platform that connects students with alumni, reduces repetitive queries using AI, and enables efficient knowledge sharing.

## 2. Proposed Solution

Mentor Bridge is an AI-powered Alumni–Student Mentorship Platform that connects students with relevant alumni and automates responses to frequently asked questions using Natural Language Processing (NLP).

The system allows students to search, filter, and connect with alumni based on attributes such as:

- Company
- Job role
- Department
- Graduation year
- Skills
- Industry domain

Once connected, students can chat with alumni through a messaging interface similar to Instagram.
The platform integrates an AI-based query matching system that detects whether a student's question has been previously answered. If a similar query exists in the knowledge base, the system automatically sends the stored answer. Otherwise, the question is forwarded to the alumni, whose response is then saved for future reuse.

This significantly reduces repeated interactions and improves mentorship efficiency.

## 3. Core Idea (AI Chat Workflow)

### Step 1 — Student asks a question

**Example:** "What skills are required to get a job in Google?"
Student1 sends this message to Alumni1.

### Step 2 — NLP similarity check

The AI system checks the database of previous questions using NLP techniques such as:

- Text preprocessing
- Semantic similarity
- Embedding comparison

The system tries to detect whether a similar question already exists.

- **Case 1 — Question NOT found:** If the question is new, the query is forwarded to the selected alumni. Alumni replies. The system stores `Question -> Answer` in the knowledge base.
- **Case 2 — Question already exists:** If the system finds a similar question (e.g., Q: What skills are required to get a job in Google? A: Data structures, algorithms, system design...), the system automatically sends the stored answer. Alumni is not disturbed.
- **Case 3 — Another student asks the same question:** The system immediately sends the stored answer. No alumni interaction required.

## 4. Key Features

1. **Alumni–Student Registration System:** Users register as Student or Alumni. Profiles include Name, Department, Graduation year, Company, Job role, Skills, Experience.
2. **Smart Alumni Search:** Filter by Company, Domain, Graduation year, Job role.
3. **Instagram-like Chat Interface:** Real-time chat, Message history, Chat threads, Clean UI.
4. **AI Query Detection (NLP):** Sentence similarity, Keyword extraction, Embedding comparison using Sentence Transformers, TF-IDF, Cosine Similarity.
5. **Knowledge Base:** Database of previously answered questions (Question, Answer, Alumni ID, Timestamp, Tags).
6. **Internship & Job Sharing:** Alumni can post openings, Referral links. Students can view career opportunities.
7. **Verified Alumni Profiles:** Verification through College email, LinkedIn, or Admin.

## 5. System Architecture (High Level)

```text
Student
   │
   │ Chat Message
   ▼
Backend Server
   │
   │ NLP Similarity Check
   ▼
Knowledge Base
   │
   ├── Similar Question Found → Send Stored Answer
   │
   └── No Match
        │
        ▼
     Alumni Chat
        │
        ▼
Store New Q&A in Database
```

## 6. Technologies Used

- **Frontend:** React.js, Tailwind CSS, Framer Motion (Instagram-style Chat UI).
- **Backend:** Node.js, Express.js, Socket.io (for chat real-time interaction).
- **AI / NLP Engine:** Python, Flask (or FastAPI), Sentence Transformers, Scikit-learn (for Cosine Similarity & TF-IDF fallback).
- **Database:** MongoDB (Users, Chats, Messages, Questions, Answers, Jobs).

## 7. Expected Outcomes

- Improve student career guidance
- Reduce alumni workload
- Enable efficient mentorship
- Provide verified internship opportunities
- Build a knowledge base of career advice

## 8. Database Schema & Entities

### 1. User

Represents both Students and Alumni.

- `UserID` (Primary Key)
- `Name`, `Email`, `Password`, `Role` (Student/Alumni)
- `Department`, `GraduationYear`, `Company`, `JobRole`, `Skills`
- `ProfilePhoto`, `CreatedAt`

### 2. Chat

Represents a conversation between student and alumni.

- `ChatID` (Primary Key)
- `StudentID` (Foreign Key), `AlumniID` (Foreign Key)
- `CreatedAt`

### 3. Message

Stores all chat messages.

- `MessageID` (Primary Key)
- `ChatID` (Foreign Key), `SenderID`
- `MessageText`, `Timestamp`, `IsAIResponse`

### 4. Question Knowledge Base

Stores previously answered questions.

- `QuestionID` (Primary Key)
- `QuestionText`, `AnswerText`, `AnsweredBy` (AlumniID)
- `EmbeddingVector`, `CreatedAt`

### 5. Job / Internship Post

- `JobID` (Primary Key)
- `PostedBy` (AlumniID)
- `Title`, `Company`, `Description`, `Location`, `ApplicationLink`, `PostedDate`

## 9. ER Relationships Summary

- `User (Student)` <---> `Chat` <---> `User (Alumni)`
- `Chat` <---> `Messages`
- `Alumni` <---> `JobPosts`
- `Alumni` <---> `QuestionKnowledgeBase`


Mentor Bridge
1. Problem Statement

Students often struggle to obtain reliable career guidance, real-world industry insights, and internship opportunities. Although AI tools and online resources provide vast theoretical knowledge, they lack practical industry experience and personalized mentorship from professionals currently working in the field.

Alumni can provide valuable insights because they have both academic experience from the same institution and real-world industry exposure. However, alumni often receive repetitive questions from multiple students, which leads to inefficiency and reduced willingness to participate actively in mentorship.

Additionally, students face difficulty in finding the right alumni based on company, role, graduation year, or domain, and there is no unified system that intelligently manages mentorship queries.

Therefore, there is a need for an intelligent platform that connects students with alumni, reduces repetitive queries using AI, and enables efficient knowledge sharing.

2. Proposed Solution

Mentor Bridge is an AI-powered Alumni–Student Mentorship Platform that connects students with relevant alumni and automates responses to frequently asked questions using Natural Language Processing (NLP).

The system allows students to search, filter, and connect with alumni based on attributes such as:

Company

Job role

Department

Graduation year

Skills

Industry domain

Once connected, students can chat with alumni through a messaging interface similar to Instagram.

The platform integrates an AI-based query matching system that detects whether a student's question has been previously answered. If a similar query exists in the knowledge base, the system automatically sends the stored answer. Otherwise, the question is forwarded to the alumni, whose response is then saved for future reuse.

This significantly reduces repeated interactions and improves mentorship efficiency.

3. Core Idea (AI Chat Workflow)
Step 1 — Student asks a question

Example:

"What skills are required to get a job in Google?"

Student1 sends this message to Alumni1.

Step 2 — NLP similarity check

The AI system checks the database of previous questions using NLP techniques such as:

Text preprocessing

Semantic similarity

Embedding comparison

The system tries to detect whether a similar question already exists.

Case 1 — Question NOT found

If the question is new:

The query is forwarded to the selected alumni.

Alumni replies.

The system stores:

Question -> Answer

in the knowledge base.

Case 2 — Question already exists

If the system finds a similar question:

Example stored in DB:

Q: What skills are required to get a job in Google?
A: Data structures, algorithms, system design, and strong coding practice.

Then:

The system automatically sends the stored answer.

Alumni is not disturbed again.

Case 3 — Another student asks the same question

Student2 asks the same question.

The system immediately sends the stored answer:

Answer: Data structures, algorithms, system design, and strong coding practice.

No alumni interaction required.

4. Key Features
1. Alumni–Student Registration System

Users register as:

Student

Alumni

Profiles include:

Name

Department

Graduation year

Company

Job role

Skills

Experience

2. Smart Alumni Search

Students can search alumni using filters such as:

Company (Google, Microsoft, etc.)

Domain (AI, Web, Data Science)

Graduation year

Job role

Example:

Search: Alumni working at Amazon
3. Instagram-like Chat Interface

Messaging features:

Real-time chat

Message history

Chat threads

Clean UI similar to Instagram DM

4. AI Query Detection (NLP)

The system detects similar questions using:

Sentence similarity

Keyword extraction

Embedding comparison

Technologies:

Sentence Transformers

TF-IDF

Cosine Similarity

5. Knowledge Base

A database of previously answered questions.

Structure:

Question
Answer
Alumni ID
Timestamp
Tags

This database grows over time and improves automation.

6. Internship & Job Sharing

Alumni can post:

Internship openings

Job opportunities

Referral links

Students can view them in a career opportunities section.

7. Verified Alumni Profiles

Alumni accounts are verified through:

College email

LinkedIn profile

Admin verification

This ensures authentic mentorship.

5. System Architecture (High Level)
Student
   │
   │ Chat Message
   ▼
Backend Server
   │
   │ NLP Similarity Check
   ▼
Knowledge Base
   │
   ├── Similar Question Found → Send Stored Answer
   │
   └── No Match
        │
        ▼
     Alumni Chat
        │
        ▼
Store New Q&A in Database
6. Technologies You Can Use
Frontend

React.js

HTML / CSS

Tailwind CSS

For chat UI similar to Instagram.

Backend

Two options:

Option 1 (Easier for students)

Node.js
Express.js
Socket.io (for chat)

Option 2

Java Spring Boot
AI / NLP
Python
FastAPI
Sentence Transformers
Scikit-learn

Used for:

Question similarity

Semantic search

Database
MongoDB

or

MySQL

Tables:

Users
Chats
Messages
Questions
Answers
Jobs
7. Expected Outcomes

The proposed system will:

Improve student career guidance

Reduce alumni workload

Enable efficient mentorship

Provide verified internship opportunities

Build a knowledge base of career advice

8. Innovation in This Project

Unlike traditional alumni platforms, Mentor Bridge integrates AI to automatically handle repetitive queries, allowing alumni to focus only on unique and meaningful discussions.

This combination of human expertise and AI automation creates a scalable mentorship ecosystem that benefits both students and alumni.
Main Entities

The system contains the following entities:

1. User

Represents both Students and Alumni.

Attributes:

UserID (Primary Key)
Name
Email
Password
Role (Student / Alumni)
Department
GraduationYear
Company
JobRole
Skills
ProfilePhoto
CreatedAt
2. Chat

Represents a conversation between student and alumni.

Attributes:

ChatID (Primary Key)
StudentID (Foreign Key)
AlumniID (Foreign Key)
CreatedAt

Relationship:

Student 1 ---- N Chat
Alumni 1 ---- N Chat
3. Message

Stores all chat messages.

Attributes:

MessageID (Primary Key)
ChatID (Foreign Key)
SenderID
MessageText
Timestamp
IsAIResponse

Relationship:

Chat 1 ---- N Messages
4. Question Knowledge Base

Stores previously answered questions.

Attributes:

QuestionID (Primary Key)
QuestionText
AnswerText
AnsweredBy (AlumniID)
CreatedAt
EmbeddingVector

Relationship:

Alumni 1 ---- N Questions
5. Job / Internship Post

Alumni can share opportunities.

Attributes:

JobID (Primary Key)
PostedBy (AlumniID)
Title
Company
Description
Location
ApplicationLink
PostedDate

Relationship:

Alumni 1 ---- N JobPosts
ER Relationships Summary
User (Student) ---- Chat ---- User (Alumni)

Chat ---- Messages

Alumni ---- JobPosts

Alumni ---- QuestionKnowledgeBase
2. System Architecture Diagram
4
Architecture Components

The system contains five main layers.

1. Frontend Layer

Used by Students and Alumni.

Technology:

React.js
HTML
CSS
JavaScript

Features:

Login / Registration

Alumni search

Chat interface (Instagram style)

Job / internship listings

2. Backend Server

Handles application logic.

Technology:

Node.js / Express
or
Spring Boot

Responsibilities:

User authentication
Chat management
API handling
Message routing
Database communication
3. AI / NLP Engine

Handles question similarity detection.

Technology:

Python
FastAPI
Sentence Transformers
Scikit-learn

Process:

Student Question
      ↓
Text Preprocessing
      ↓
Sentence Embedding
      ↓
Similarity Search
      ↓
Match Found? → Return stored answer
No Match → Send to Alumni
4. Database Layer

Stores all system data.

Example:

MongoDB
or
MySQL

Data stored:

Users
Chats
Messages
Questions
Answers
Jobs
5. Knowledge Base

Special database storing:

Previously asked questions
Answers
Embeddings
Tags

This enables AI automatic answering.

3. Database Schema

Below is a simple schema design for implementation.

Table 1 — Users
Users
--------------------------------
user_id (PK)
name
email
password
role
department
graduation_year
company
job_role
skills
profile_photo
created_at

Role values:

Student
Alumni
Table 2 — Chats
Chats
--------------------------------
chat_id (PK)
student_id (FK)
alumni_id (FK)
created_at

Purpose:

Stores conversation sessions
Table 3 — Messages
Messages
--------------------------------
message_id (PK)
chat_id (FK)
sender_id (FK)
message_text
timestamp
is_ai_generated

Purpose:

Stores chat messages

Example:

Student: How to prepare for Google interviews?
AI: Practice DSA and system design.
Table 4 — Question Knowledge Base
Questions
--------------------------------
question_id (PK)
question_text
answer_text
answered_by (FK)
embedding_vector
created_at

Purpose:

Stores reusable Q&A
for NLP similarity search
Table 5 — Job Posts
JobPosts
--------------------------------
job_id (PK)
posted_by (FK)
title
company
description
location
application_link
posted_date

Example:

Title: Software Engineer Intern
Company: Microsoft
Location: Bangalore
Table Relationships Overview
Users
   │
   ├── Chats
   │       │
   │       └── Messages
   │
   ├── Questions (Knowledge Base)
   │
   └── JobPosts
Simple Database Relationship Diagram
Users
  │
  ├── Chats
  │       │
  │       └── Messages
  │
  ├── Questions
  │
  └── JobPosts
How the System Works (Flow)
Student asks question
        ↓
Backend receives message
        ↓
AI NLP similarity check
        ↓
Question exists?
   │            │
 YES            NO
   │            │
Send stored     Send to Alumni
answer          ↓
                Alumni reply
                ↓
           Store in database