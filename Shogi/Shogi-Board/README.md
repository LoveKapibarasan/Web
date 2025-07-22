```markdown
# Shogi Board (HTML/JS)

This project is a simple **client-side Shogi board** written in pure HTML, CSS, and JavaScript. It allows:

- 📄 **Loading board position** via SFEN  
- 🎯 **Drag-and-drop movement** of pieces  
- 🔁 **Promotion support**  
- 🎌 **Capturing opponent pieces**  
- 🈳 **Dropping captured pieces (打つ)**  
- 🔄 **Orientation and ownership-aware display**  

---

## 📦 Features

### ✅ SFEN Support
- Load a board position using a [SFEN](https://en.wikipedia.org/wiki/Shogi_notation#SFEN_format) string.
- Automatically places all pieces on a 9x9 board.

### ✅ Drag-and-Drop Movement
- Click-and-drag any piece to a new square.
- The source square is cleared after move.

### ✅ Piece Promotion
- Moving into the promotion zone triggers a **confirmation prompt**.
- Promotion rules are only applied when:
  - The piece is moving **from the board**
  - The piece is **not already promoted**
  - The destination is in promotion zone (rows 0–2 for black, 6–8 for white)

### ✅ Capture and Drop (打つ)
- Capturing a piece adds it to your hand.
- Pieces in-hand can be dropped onto **empty squares only**.
- Captured pieces revert to their **unpromoted** state.
- Drops do **not** allow promotion.

### ✅ Orientation and Ownership
- Black's pieces (先手) face up.
- White's pieces (後手) are rotated 180°.
- Captured pieces are reassigned to the capturing side correctly.

---

## 🚀 Usage

1. Open `index.html` in any modern browser.
2. Use the input field to load a position in SFEN format:
   ```text
   lnsgkgsnl/1r5b1/p1pppp1p1/6p2/9/2P6/PP1PPPPPP/1B5R1/LNSGKGSNL w - 1
   ```
3. Drag-and-drop pieces to move or capture.
4. Captured pieces appear below and can be dropped back onto the board.

---

## 📂 File Structure

```text
index.html    ← Single-file implementation  
README.md     ← This documentation  
```

---


## 📘 Credits

- Shogi piece kanji courtesy of standard conventions.
- Created by [Your Name] – Feel free to modify or extend!

---

## 📝 License

This project is open-source and free to use under the MIT License.
```
