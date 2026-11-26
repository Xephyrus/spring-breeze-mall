import plugins from "./plugins";
import toobar from "./toolbar";

// tinymce 6.4.2：从 public/tinymce 静态目录加载（index.html 里引入主脚本）
const localCDN = window.location.origin + import.meta.env.BASE_URL + "tinymce";
export const initEditor = {
  base_url: localCDN,
  height: "400px",
  language: "zh-Hans",
  menubar: "file edit  view format table", // 菜单:指定应该出现哪些菜单
  toolbar: toobar, // 分组工具栏控件
  plugins:plugins, // 插件(比如: advlist | link | image | preview等)
  // 插入日期/时间：下拉里的选项就是 insertdatetime_formats 的每一项
  // （不显式配置时默认是英文格式，且菜单可能为空）
  insertdatetime_formats: [
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%d",
    "%H:%M:%S",
    "%Y年%m月%d日",
  ],
  insertdatetime_timeformat: "%H:%M:%S",
  insertdatetime_dateformat: "%Y-%m-%d",
  object_resizing: false, // 是否禁用表格图片大小调整
  end_container_on_empty_block: true, // enter键 分块
  powerpaste_word_import: "merge", // 是否保留word粘贴样式  clean | merge
  advlist_bullet_styles: "square", // 无序列表 有序列表
  maxSize: "2097152", // 设置图片大小
  accept: "image/jpeg, image/png", // 设置图片上传规则
  paste_data_images:false,
  browser_spellcheck: true, // 拼写检查
  branding: false,
  // 编辑器自身不再拖拽调整大小，尺寸交给外层容器控制
  resize: false,
  // 工具栏换行而不是横向滚动
  toolbar_mode: "wrap", // 去水印
  elementpath: false, // 禁用编辑器底部的状态栏
  statusbar: false, // 隐藏编辑器底部的状态栏
  // init_instance_callback: function (editor) {
  //   var freeTiny = document.querySelector(".tox .tox-notification--in .tox-notification .tox-notification--warning .tox .tox-notification--warning .tox-notifications-container");
  //   freeTiny.style.display = "none";
  // },
  content_style: `
    * { padding:0; margin:0; }

    html, body height:100%; }

    img { max-width:100%; display:block;height:auto; }

    a   { text-decoration: none; }

    iframe{ width: 100%; }

    p { line-height:1.6; margin: 0px; }

    table{ word-wrap:break-word; word-break:break-all; max-width:100%; border:none; border-color:#999; }

    .mce-object-iframe{ width:100%; box-sizing:border-box; margin:0; padding:0; }

    ul,ol{ list-style-position:inside; }
    `, // 设置样式
};
