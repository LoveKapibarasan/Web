import { LitElement, css, html } from "https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js";
import { unsafeHTML } from "https://unpkg.com/lit-html@2.8.0/directives/unsafe-html.js";

/** ✅ GitHub Setting */
let GITHUB_TOKEN = "";
const OWNER = "LoveKapibarasan";
const REPO = "Shogi_Quiz";
const BRANCH = "main";
const FOLDER_PATH = "match";
const moveSound = new Audio("https://cxu.igu.mybluehost.me/wp-content/uploads/2025/06/spo_ge_syogi_s03.mp3");
const correctSound = new Audio("https://cxu.igu.mybluehost.me/wp-content/uploads/2025/06/クイズ正解1.mp3");
const incorrectSound = new Audio("https://cxu.igu.mybluehost.me/wp-content/uploads/2025/06/クイズ不正解1.mp3");

const githubHeaders = () => ({
  "Authorization": `token ${GITHUB_TOKEN}`,
  "Accept": "application/vnd.github.v3+json",
  "Content-Type": "application/json"
});
const keys = {
  "不成": "",
  "全": "成銀",
  "杏": "成香",
  "圭": "成桂",
  "竜": "龍"
};
function replaceChars(str) {
  // まず keys を長い順にソートして置換する！
  let result = str;
  const sortedKeys = Object.keys(keys).sort((a,b) => b.length - a.length);
  for (const k of sortedKeys) {
    result = result.split(k).join(keys[k]);
  }
  return result;
}
if (localStorage.getItem("GITHUB_TOKEN")) {
  GITHUB_TOKEN = localStorage.getItem("GITHUB_TOKEN");
  console.log("Token restored from Local Storage");
}
/** ✅ UTF-8 Base64 ユーティリティ */
function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(str) {
  return decodeURIComponent(escape(atob(str)));
}
document.getElementById("loginBtn").addEventListener("click", () => {
  const input = document.getElementById("tokenInput").value;
  if (!input || !input.startsWith("ghp_")) {
    alert("有効な GitHub Token を入力してください");
    return;
  }
  GITHUB_TOKEN = input;
  localStorage.setItem("GITHUB_TOKEN", GITHUB_TOKEN);
  // 表示切り替え
  document.getElementById("loginBtn").style.display = "none";
  document.getElementById("tokenInput").style.display = "none";

});
/** Main Code */
export class ShogiQuiz extends LitElement {
  static styles = css`
     :host { display: block; }
     .container { display: flex; flex-wrap: wrap; justify-content: center; }
     /* デフォルトは縦並び（スマホ） */
     shogi-player-wc{
       flex-basis: 100%;
     }
     .information {
       flex-direction: column; /* 縦積み */
       align-items: flex-start; /* 左寄せ */
       flex-basis: 100%;
     }
        #teban {
    font-weight: bold;
    font-size: 1.2em;
    color: darkgreen;
    margin: 0.5em 0;
    } 
    .Eval {
    display: block; /* 確実にブロック化 */
    background-color: #f5f5f5;
    border-left: 4px solid #555;
    padding: 4px 8px;
    margin: 4px 0;
    font-family: monospace;
    font-size: 1em;
    font-weight: bold;
    color: #d32f2f; /* 評価値を目立たせる赤系 */
    } 
    .button {
    display: inline-block;
    margin: 8px 4px;
    padding: 10px 20px;
    font-size: 1em;
    font-weight: bold;
    color: #fff;
    background-color: #007acc;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    }

    .button:hover {
        background-color: #005fa3;
    }

    .button:active {
        background-color: #004f8c;
     }

     .button:focus {
       outline: none;
       box-shadow: 0 0 0 2px rgba(0,123,204,0.4);
      }
     /* 画面が800px以上なら横並びにする */
     @media (min-width: 800px) {
         .container {flex-direction: row; /* 横並び */align-items: flex-start;}
         shogi-player-wc {flex: 2;}
         .information {flex: 1;}
     }
     `;

  static properties = {
    sourceList: { type: Array },
    expectedList: { type: Array },
    commentList: { type: Array },
    index: { type: Number },
    source: { type: String },
    expected: { type: String },
    comment: { type: String },
    reverse: { type: String },
    white: { type: String },
    black: { type: String },
    currentFile: { type: String }, //  Current File Name
    currentSha: { type: String },   //  Current SHA
  };

  constructor() {
    super();
    this.sourceList = [];
    this.expectedList = [];
    this.commentList = [];
    this.index = 0;
    this.source = "";
    this.expected = "";
    this.comment = "";
    this.reverse = "";
    this.white = "";
    this.black = "";
    this.currentFile = "";
    this.currentSha = "";
    this.loadDueFile();
  }

  render() {
    return html`
      <div class="container">
        <shogi-player-wc
          sp_mode="play"
          sp_body="${this.source}"
          @ev_play_mode_move="${this.ev_play_mode_move}"
          sp_viewpoint="${this.reverse}"
          sp_board_variant="wood_normal"
          sp_piece_variant="portella"
          sp_mobile_vertical="false"
        ></shogi-player-wc>
        <div class="information">
          <p id = teban>${this.expected.includes("☗") ? "☗先手番" : "☖後手番"}</p>
          <div>☗: ${this.black}<br>☖: ${this.white}</div>
          ${unsafeHTML(this.comment)}
          <button class = button @click="${this.deleteQuestion}">Delete</button>
          <button class = button @click="${this.deleteBeforeQuestion}">Delete before</button>
          <button class = button @click="${this.deleteFourSetQuestions}">Delete four</button>
          <button class = button @click="${this.loadDueFile}">Load Due From GitHub</button>
          <button class = button @click="${this.promoteAndSave}">Promote & Save</button>
          <button class = button @click="${this.nextQuestion}">Skip</button>
        </div>
      </div>
    `;
  }

  ev_play_mode_move(e) {
    this.playMoveSound();
    const move = e.detail[0].last_move_info.to_kif;
    setTimeout(() => {
      const normMove = replaceChars(move.trim().normalize().replace(/\s+/g, ""));
      const normExpected = this.expected.trim().normalize().replace(/\s+/g, "");
      console.log("paar is",normMove, normExpected);
      if (normMove === normExpected) {
        this.comment = this.commentList[this.index];
        if (this.comment.trim() === "") {
          setTimeout(() => this.nextQuestion(), 1000);
        } else {
          this.playCorrectSound()
          setTimeout(() => this.nextQuestion(), 8000);
        }
      } else {
        this.playIncorrectSound()
        alert(this.expected);
        this.reloadQuestion();
      }
    }, 100);
  }

  nextQuestion() {
    this.playMoveSound();
    this.index++;
    if (this.index < this.sourceList.length) {
      this.source = this.sourceList[this.index];
      this.expected = this.expectedList[this.index];
      this.comment = "";
    } else {
      alert("All done! Wait 5 seconds");
      this.promoteAndSave();
      setTimeout(() => {
        this.loadDueFile();
      },5000 );
    }
  }

  reloadQuestion() {
    this.source = "";
    setTimeout(() => {
      this.source = this.sourceList[this.index];
      this.expected = this.expectedList[this.index];
      this.comment = "";
    }, 0);
  }

  deleteBeforeQuestion() {
    const deletedSource = this.expectedList[this.index - 1];
    if (!confirm(`"Delete ${deletedSource}"？`)) return;
    this.sourceList.splice(this.index - 1, 1);
    this.expectedList.splice(this.index - 1, 1);
    this.commentList.splice(this.index - 1, 1);
    this.index = this.index - 2;
    this.nextQuestion();
  }
  deleteQuestion() {
    const deletedSource = this.expectedList[this.index ];
    if (!confirm(`"Delete ${deletedSource}"？`)) return;
    this.sourceList.splice(this.index , 1);
    this.expectedList.splice(this.index , 1);
    this.commentList.splice(this.index , 1);
    this.index = this.index - 1;
    this.nextQuestion();
  }
  deleteFourSetQuestions() {
    const pos = Math.floor(this.index / 4);
    const start = 4 * pos;
    const deletedSourceStart = this.expectedList[start];
    const deletedSourceEnd = this.expectedList[start + 3];
    if (!confirm(`"Delete from ${deletedSourceStart} to ${deletedSourceEnd}"？`)) return;
    this.sourceList.splice(start, 4);
    this.expectedList.splice(start, 4);
    this.commentList.splice(start, 4);
    this.index = start - 1;
    this.nextQuestion();
  }




  async loadDueFile() {
    // 1. Get a file list in the Repo (only meta information)
    const url =   `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FOLDER_PATH}?ref=${BRANCH}`;
    const res = await fetch(url, { headers: githubHeaders() });
    const files = await res.json();

    const today = new Date();
    for (const file of files) {
      if (file.type !== "file") continue;
      const match = file.name.match(/^(\d+)_(\d{4}-\d{2}-\d{2})(?:_([^/\\]+))?\.json$/);
      if (!match) continue;

      const level = parseInt(match[1]);
      const baseDate = match[2];
      const target = new Date(baseDate);
      const due = new Date(target);
      due.setDate(target.getDate() + Math.pow(2, level));

      if (today >= due) {
        // Target
        const fileRes = await fetch(file.url, { headers: githubHeaders() });
        const fileData = await fileRes.json();
        const content = base64ToUtf8(fileData.content);
        const json = JSON.parse(content);

        this.applyData(json);
        this.currentFile = file.name;
        this.currentSha = fileData.sha;

        alert(`復習ファイル読み込み成功: ${file.name}`);
        return;
      }
    }

    alert("復習すべきファイルはありません！");
  }

  async promoteAndSave() {
    if (!this.currentFile) {
      alert("No file");
      return;
    }
    // 新ファイル名生成: Level+1 & Today
    const match = this.currentFile.match(/^(\d+)_(\d{4}-\d{2}-\d{2})(_([^/\\]+))?\.json$/);
    if (!match) {
      alert("No file name match");
      return;
    }

    const newLevel = parseInt(match[1]) + 1;
    const todayStr = new Date().toISOString().split("T")[0];
    const id = match[3];
    const newFileName = `${newLevel}_${todayStr}${id}.json`;
    const NEW_FILE_PATH = `${FOLDER_PATH}/${newFileName}`;

    // PUT
    const newContent = utf8ToBase64(JSON.stringify(this.getData(), null, 2));
    const putBody = {
      message: `Promote to level ${newLevel}`,
      content: newContent,
      branch: BRANCH
    };

    const newUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${NEW_FILE_PATH}`;
    const putRes = await fetch(newUrl, {
      method: "PUT",
      headers: githubHeaders(),
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      alert(`新ファイル保存失敗: ${putRes.statusText}`);
      return;
    }

    // DELETE
    const OLD_FILE_PATH = `${FOLDER_PATH}/${this.currentFile}`;
    const delBody = {
      message: `Delete old file ${this.currentFile}`,
      sha: this.currentSha,
      branch: BRANCH
    };
    const delUrl =  `https://api.github.com/repos/${OWNER}/${REPO}/contents/${OLD_FILE_PATH}`;
    await fetch(delUrl, {
      method: "DELETE",
      headers: githubHeaders(),
      body: JSON.stringify(delBody)
    });

    alert(`昇格完了！ 新ファイル: ${newFileName}`);
    this.currentFile = "";
    this.currentSha = "";
  }

  applyData(data) {
    this.sourceList = data.sourceList || [];
    this.expectedList = data.expectedList || [];
    this.commentList = data.commentList || [];
    this.reverse = data.reverse || "";
    this.white = data.white || "";
    this.black = data.black || "";
    this.index = 0;
    this.source = this.sourceList[this.index] || "";
    this.expected = this.expectedList[this.index] || "";
    this.comment = "";
  }

  getData() {
    return {
      sourceList: this.sourceList,
      expectedList: this.expectedList,
      commentList: this.commentList,
      reverse: this.reverse,
      white: this.white,
      black: this.black
    };
  }
  playMoveSound() {
    moveSound.currentTime = 0; // 毎回先頭から
    moveSound.play();
  }

  playCorrectSound() {
    correctSound.currentTime = 0;
    correctSound.play();
  }

  playIncorrectSound() {
    incorrectSound.currentTime = 0;
    incorrectSound.play();
  }
}

customElements.define("shogi-quiz", ShogiQuiz);
