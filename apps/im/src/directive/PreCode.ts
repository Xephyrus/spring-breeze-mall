import type { DirectiveBinding } from "vue";
import { copyTextToClipboard as Clipboard } from "@/utils/functions";

/** 给代码块加「复制」按钮 */
const copyFunc = (pre: HTMLElement, text: string): void => {
  const el = document.createElement("p");
  el.className = "fz-btn";
  el.innerText = "复制";
  el.onclick = () => {
    Clipboard(text.replace(/(^\s*)|(\s*$)/g, ""), function () {
      el.innerText = "复制成功!";
      setTimeout(() => {
        el.innerText = "复制";
      }, 1000);
    });
  };

  pre.appendChild(el);
};

/** 给代码块加语言标签 */
const preNmae = (pre: HTMLElement, lang: string): void => {
  const el = document.createElement("p");
  el.className = "lang-name";
  el.innerText = lang;
  pre.appendChild(el);
};

function updateNodes(el: HTMLElement, _binding?: DirectiveBinding): void {
  const preNodes = el.querySelectorAll("pre");
  preNodes.forEach((elPre) => {
    const elCode = elPre.querySelector("code");
    if (!elCode) return;
    const className = elCode.className;
    const language = className.split("-")[1];

    copyFunc(elPre, elCode.innerText);

    if (language != undefined) {
      preNmae(elPre, language);
    }
  });
}

/** 代码块格式化指令（v-pre-code） */
export default {
  bind: updateNodes,
  update: updateNodes,
};
