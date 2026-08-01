# User Guide

Welcome to RecallPath AI! This guide will walk you through the core features of the application, from creating your first study deck to practicing with advanced AI evaluations.

## 1. Creating and Managing Decks

Decks are the primary way to organize your study materials in RecallPath AI.

1. Navigate to the **My Decks** (Mis conjuntos) page.
2. Click the **New Deck** (Nuevo conjunto) button.
3. Enter a name and a brief description for your topic.
4. Once created, the deck will appear in your grid.

![Deck overview](images/01-decks-overview.png)

## 2. Managing Flashcards

Inside a deck, you can manually create flashcards.

1. Click on a deck to open its details.
2. Click **Add Flashcard** (Agregar tarjeta).
3. Type the **Term** and its **Definition**.
4. You can edit, archive, or restore existing flashcards from the list view. To archive, use the archive action on a flashcard. To restore, use the restore action on an archived flashcard.

![Flashcard management](docs/images/02-deck-detail.png)

## 3. Uploading a PDF and Generating Flashcards

Instead of typing everything manually, you can let Google Gemini read a document and generate the flashcards for you.

> [!WARNING]
> Do not upload highly confidential or sensitive documents when using the real Google Gemini provider, as the extracted text will be sent to external AI servers.

1. Open **Documents** (`Documentos`) from the main navigation.
2. Upload and process a PDF.
3. Open the document.
4. Select the page range.
5. Choose the destination deck when configuring generation.
6. Generate the flashcards.

![PDF generation](images/03-document-generation.png)

## 4. Reviewing and Approving Generated Cards

RecallPath AI keeps a "Human-in-the-Loop" to ensure study quality. The AI won't silently add bad flashcards to your deck.

1. After generation completes, navigate to the **Pending Review** (Pendientes de revisión) tab.
2. You will see a list of flashcards proposed by the AI.
3. Read each card. You can click the **Edit** icon if the AI missed a detail.
4. Click **Approve** (Aprobar) to add the card to your active practice list, or **Reject** (Rechazar) if it's incorrect.

![Generated-card review](images/04-generated-cards-review.png)

## 5. Starting a Practice Session

Once you have active flashcards (either manually created or AI-approved), you can practice them.

1. In the deck view, click the **Practice** (Practicar) button.
2. A modal will appear allowing you to select your preferred practice mode.

![Practice mode selection](images/05-practice-modes.png)

## 6. The Practice Modes

RecallPath AI offers three distinct ways to practice:

### Recall Practice (Traditional Flashcards)
- The term is displayed. You try to remember the definition.
- Click **Show Answer**.
- Self-evaluate your memory by clicking **Easy**, **Good**, **Hard**, or **Again**.

### Multiple-Choice Practice
- The term is displayed along with 4 possible definitions.
- Click the definition you believe is correct.
- The system will immediately tell you if you were right or wrong. *(Note: This mode requires at least 4 active flashcards in your deck to provide enough distractors).*

### Written-Answer Practice (AI Semantic Evaluation)
- The term is displayed alongside a text box.
- Type your explanation of the term in your own words.
- Click **Evaluate**.
- Google Gemini will read your answer. It doesn't look for an exact word-for-word match. It evaluates whether you understood the core concept.
- The AI will provide feedback on why you were right or wrong, acting as a personal tutor.

![Written-answer evaluation](images/06-written-practice-result.png)

## 7. Reviewing Results and Practicing Incorrect Answers

At the end of your session (Multiple-Choice or Written-Answer), you will see a summary screen.

1. The screen displays your **Accuracy Percentage** and the total number of correct/incorrect answers.
2. Below the summary, you can scroll through the session history to review exactly what you got wrong and read the AI's feedback.
3. Use the action buttons to continue:
   - **Review X mistakes** (Repasar X errores): Creates a new session with only the incorrectly answered cards.
   - **Practice again** (Practicar de nuevo): Creates a new session with all eligible cards.
   - **Back to deck** (Volver al conjunto): Returns to the deck details.

## 8. Archiving and Restoring

- **Decks**: You can archive a deck from the **My Decks** view using the archive action. Archived decks cannot be practiced and no new cards can be added. To restore, use the unarchive action.
- **Flashcards**: Inside a deck, you can archive individual flashcards so they won't appear in practice sessions. Use the restore action to bring them back.
