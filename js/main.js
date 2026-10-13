/* =========================================================
 * ZND::TERMINAL — 交互内核
 * 模块：①开机自检 ②时钟/HUD ③打字机 ④神经网络背景
 *       ⑤滚动揭示 ⑥滚动定位导航 ⑦终端命令系统
 * 学习提示：想改行为，先找到对应编号的模块注释
 * ========================================================= */

"use strict";

/* ---------------------------------------------------------
 * ① 开机自检（BOOT）
 * 纯文本逐行打出，可点击/按键跳过；不依赖任何存储
 * ------------------------------------------------------- */
(function bootSequence() {
  const boot = document.getElementById("boot");
  const log = document.getElementById("bootLog");
  if (!boot || !log) return;

  const LINES = [
    "[ 正常 ] 正在初始化「左恩东个人终端」v1.0 …",
    "[ 正常 ] 挂载身份档案：姓名 = 左恩东",
    "[ 正常 ] 加载分区：关于 / 技能 / 经历 / 项目",
    "[ 正常 ] 连接神经网络背景 … 已建立若干条链路",
    "[ 正常 ] 联系通道待命",
    "[就绪] 系统启动完成，欢迎接入。"
  ];

  let i = 0, done = false, timer = null;

  function finish() {
    if (done) return;
    done = true;
    clearInterval(timer);
    boot.classList.add("gone");
    document.body.style.overflow = "";
  }

  function next() {
    if (i >= LINES.length) { setTimeout(finish, 480); return; }
    const p = document.createElement("div");
    p.textContent = LINES[i++];
    log.appendChild(p);
  }

  document.body.style.overflow = "hidden";
  timer = setInterval(next, 260);

  // 跳过：点击、滚动或任意键
  boot.addEventListener("click", finish);
  window.addEventListener("keydown", finish, { once: true });
  setTimeout(finish, 6000); // 兜底：6 秒后强制结束
})();

/* ---------------------------------------------------------
 * ② 时钟 + HUD 日期
 * ------------------------------------------------------- */
(function clock() {
  const el = document.getElementById("clock");
  const hud = document.getElementById("hudDate");
  const pad = n => String(n).padStart(2, "0");

  function tick() {
    const d = new Date();
    if (el) el.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    if (hud) hud.textContent = d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate());
  }
  tick();
  setInterval(tick, 1000);

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();

/* ---------------------------------------------------------
 * ③ 身份打字机（循环切换）
 * ------------------------------------------------------- */
(function typewriter() {
  const target = document.getElementById("typed");
  if (!target) return;

  // 想换首屏滚动的句子，改这个数组就行
  const PHRASES = [
    "AI 应用开发探索者",
    "上师大 · 计科 · 大三在读",
    "深度学习持续学习中",
    "用 AI 重新定义学习与创造",
    "游戏 · 剧本杀 · 电影 · 旅行 · 美食"
  ];

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { target.textContent = PHRASES[0]; return; }

  let pi = 0, ci = 0, deleting = false;

  function step() {
    const word = PHRASES[pi];
    ci += deleting ? -1 : 1;
    target.textContent = word.slice(0, ci);

    let delay = deleting ? 38 : 95;
    if (!deleting && ci === word.length) { delay = 2200; deleting = true; }
    else if (deleting && ci === 0) {
      deleting = false;
      pi = (pi + 1) % PHRASES.length;
      delay = 420;
    }
    setTimeout(step, delay);
  }
  step();
})();

/* ---------------------------------------------------------
 * ④ Canvas 神经网络粒子背景
 *    节点缓慢漂移，距离近就连线；鼠标附近节点被轻微吸引
 *    reduced-motion 用户：画一张静态图后不再动画
 * ------------------------------------------------------- */
(function networkBackground() {
  const canvas = document.getElementById("netBg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, nodes = [];
  const mouse = { x: -9999, y: -9999 };
  const LINK_DIST = 130;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(78, Math.max(30, Math.round(W * H / 22000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - .5) * .35,
      vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.6 + .7
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const n of nodes) {
      // 鼠标轻吸引
      const dxm = mouse.x - n.x, dym = mouse.y - n.y;
      const dm = Math.hypot(dxm, dym);
      if (dm < 160 && dm > 0.01) { n.vx += dxm / dm * 0.004; n.vy += dym / dm * 0.004; }

      n.x += n.vx; n.y += n.vy;
      // 阻尼，防止被鼠标越带越快
      n.vx *= .992; n.vy *= .992;
      // 保底速度，避免完全停下
      if (Math.hypot(n.vx, n.vy) < .12) { n.vx += (Math.random() - .5) * .04; n.vy += (Math.random() - .5) * .04; }

      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
      n.x = Math.max(0, Math.min(W, n.x));
      n.y = Math.max(0, Math.min(H, n.y));
    }

    // 连线
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * .32;
          ctx.strokeStyle = "rgba(56, 225, 255, " + alpha.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    // 节点
    for (const n of nodes) {
      ctx.fillStyle = "rgba(56, 225, 255, .7)";
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  let raf = null;
  function loop() { draw(); raf = requestAnimationFrame(loop); }

  resize();
  draw();
  if (!reduce) {
    loop();
    window.addEventListener("resize", () => {
      cancelAnimationFrame(raf);
      resize();
      loop();
    });
    window.addEventListener("pointermove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduce) loop();
    });
  } else {
    window.addEventListener("resize", resize);
  }
})();

/* ---------------------------------------------------------
 * ④b 头像框轨道粒子
 *    粒子分布在头像外圈两条环形轨道上，各自公转 + 明暗闪烁，
 *    几颗"流星"粒子带辉光；尺寸跟随 CSS 变量 --av 自适应。
 *    省电：离开视口 / 切到后台标签页时暂停；减少动效时只画一帧。
 * ------------------------------------------------------- */
(function avatarParticles() {
  const canvas = document.getElementById("avatarFx");
  const wrap = document.getElementById("avatarWrap");
  if (!canvas || !wrap) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COLORS = [
    [56, 225, 255],   // 青（主）
    [56, 225, 255],
    [56, 225, 255],
    [176, 107, 255],  // 紫
    [109, 255, 180]   // 绿
  ];

  let W = 0, H = 0, particles = [];

  function resize() {
    const rect = wrap.getBoundingClientRect();
    W = rect.width; H = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 两条轨道：内圈贴头像边缘，外圈贴虚线环外侧
    const count = W < 170 ? 22 : (W < 230 ? 32 : 42);
    particles = Array.from({ length: count }, (_, i) => {
      const outer = i % 3 === 0;   // 每 3 颗有 1 颗走外圈
      const comet = i % 9 === 0;   // 少量带辉光的"流星"
      return {
        angle: Math.random() * Math.PI * 2,
        speed: (0.0022 + Math.random() * 0.004) * (Math.random() < .5 ? -1 : 1),
        radius: outer
          ? H / 2 * (0.93 + Math.random() * 0.07)
          : H / 2 * (0.80 + Math.random() * 0.10),
        size: comet ? 2.4 + Math.random() * 1.2 : 0.9 + Math.random() * 1.5,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.012 + Math.random() * 0.03,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        comet: comet
      };
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;

    for (const p of particles) {
      p.angle += p.speed;
      p.tw += p.twSpeed;
      const alpha = .25 + .65 * Math.abs(Math.sin(p.tw));
      const x = cx + Math.cos(p.angle) * p.radius;
      const y = cy + Math.sin(p.angle) * p.radius;
      const [r, g, b] = p.color;

      if (p.comet) {
        // 流星：辉光 + 沿公转方向的一小段尾迹
        ctx.save();
        ctx.shadowColor = "rgba(" + r + "," + g + "," + b + ",.9)";
        ctx.shadowBlur = 9;
        ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
        ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        const tailX = cx + Math.cos(p.angle - p.speed * 900) * p.radius;
        const tailY = cy + Math.sin(p.angle - p.speed * 900) * p.radius;
        const grad = ctx.createLinearGradient(tailX, tailY, x, y);
        grad.addColorStop(0, "rgba(" + r + "," + g + "," + b + ",0)");
        grad.addColorStop(1, "rgba(" + r + "," + g + "," + b + "," + (alpha * .7) + ")");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(x, y); ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  let raf = null, visible = true;
  function loop() {
    if (!visible || reduce) return;
    draw();
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (!raf && visible && !reduce) { raf = requestAnimationFrame(loop); }
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  resize();
  draw(); // 先画一帧，即使动画暂停也有粒子

  if (!reduce) {
    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(wrap);
    } else {
      window.addEventListener("resize", resize);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }).observe(wrap);
    }
    start();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else start();
    });
  }
})();

/* ---------------------------------------------------------
 * ⑤ 滚动揭示（IntersectionObserver）
 * ------------------------------------------------------- */
(function scrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  items.forEach(el => io.observe(el));
})();

/* ---------------------------------------------------------
 * ⑥ 侧边导航：滚到哪个板块就高亮哪个
 * ------------------------------------------------------- */
(function scrollSpy() {
  const links = Array.from(document.querySelectorAll(".side-link"));
  const map = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
  const sections = Array.from(map.keys())
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function update() {
    const probe = window.scrollY + window.innerHeight * .35;
    let current = sections[0].id;
    for (const s of sections) if (probe >= s.offsetTop) current = s.id;
    // 修复：页面滚到底时强制高亮最后一项（否则较短的"联系"区永远够不到探针线）
    if (window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1].id;
    }
    links.forEach(a => {
      const isCur = a.getAttribute("href") === "#" + current;
      a.classList.toggle("cur", isCur);
      if (isCur) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  update();
})();

/* ---------------------------------------------------------
 * ⑥b 移动端抽屉导航：菜单按钮开合侧栏 + 遮罩/Esc 关闭
 * ------------------------------------------------------- */
(function drawerNav() {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sideBackdrop");
  const menuBtn = document.getElementById("menuBtn");
  if (!sidebar || !backdrop || !menuBtn) return;

  function setDrawer(open) {
    sidebar.classList.toggle("open", open);
    backdrop.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    const ico = menuBtn.querySelector(".mb-ico");
    const txt = menuBtn.querySelector(".mb-txt");
    if (ico) ico.textContent = open ? "✕" : "☰";
    if (txt) txt.textContent = open ? "关闭" : "菜单";
    document.body.classList.toggle("drawer-lock", open);
  }

  menuBtn.addEventListener("click", () =>
    setDrawer(!sidebar.classList.contains("open")));
  backdrop.addEventListener("click", () => setDrawer(false));
  sidebar.querySelectorAll(".side-link").forEach(a =>
    a.addEventListener("click", () => setDrawer(false)));
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && sidebar.classList.contains("open")) setDrawer(false);
  });
})();

/* ---------------------------------------------------------
 * ⑦ 终端命令系统
 *    这是"用命令认识我"的核心；将来可以在这里接真 AI：
 *    未命中本地命令时，把输入转发给大模型 API（见 CHAT_API 注释）
 * ------------------------------------------------------- */
(function terminal() {
  const output = document.getElementById("termOutput");
  const input = document.getElementById("termInput");
  const app = document.getElementById("termApp");
  if (!output || !input) return;

  /* 个人知识库：改这里就能让终端"认识你" */
  const INFO = {
    name: "左恩东",
    major: "计算机科学与技术（大三）",
    school: "上海师范大学 · 信息与机电工程学院",
    role: "班级生活委员（大一曾任院学生会社团部）",
    focus: "AI 应用开发 / 深度学习",
    email: "1792281449@qq.com",
    phone: "18016261462"
  };

  // 将来接真 AI 时，把云函数地址填到这里；留空则纯本地运行
  const CHAT_API = "https://1504350366-jssn3unqom.ap-shanghai.tencentscf.com";

  // 指令以中文为主；英文写法保留为别名（见下方 ALIASES）
  const COMMANDS = {
    帮助() {
      return [
        "<sys>可用指令列表（直接输入中文即可）</sys>",
        "<b>帮助</b>    显示本指令列表",
        "<b>关于</b>    我是谁",
        "<b>技能</b>    我的技能栈",
        "<b>经历</b>    成长记录",
        "<b>项目</b>    项目档案",
        "<b>联系</b>    联系方式",
        "<b>我是谁</b>  趣味自检",
        "<b>目录</b>    列出页面所有分区",
        "<b>清屏</b>    清空终端内容",
        "<sys>其他任何问题直接输入 → 交给 AI 助手（配置云端后生效）</sys>",
        "<sys>小提示：英文命令也能用，比如 help、about。</sys>"
      ];
    },
    关于() {
      return [
        "<sys>&gt; 正在读取身份档案</sys>",
        "姓名：<b>" + INFO.name + "</b>",
        "学校：<b>" + INFO.school + "</b>",
        "专业：<b>" + INFO.major + "</b>",
        "职务：<b>" + INFO.role + "</b>",
        "主攻方向：<b>" + INFO.focus + "</b>",
        "学习风格：深度研究型，习惯用 AI 提问 → 自己验证 → 复盘沉淀。",
        "生活频道：游戏 / 剧本杀 / 电影 / 旅行 / 美食。"
      ];
    },
    技能() {
      return [
        "<sys>&gt; 正在加载技能模块</sys>",
        "编程语言：C · Python · Java · 数据结构 · 算法",
        "人工智能：深度学习 · 提示词工程 · AI 辅助编程",
        "数学基础：高等数学 · 线性代数 · 概率论 · 离散数学",
        "工具装备：Git · Linux 基础 · LaTeX · AI 编程助手"
      ];
    },
    经历() {
      return [
        "<sys>&gt; 成长版本记录</sys>",
        "v2026.10【当前版本】大三进行时：AI 探索 + 班级生活委员",
        "v2025.09           就任班级生活委员",
        "v2024.09           入学 · 院学生会社团部",
        "完整内容请向上滚动页面，查看「成长日志」分区。"
      ];
    },
    项目() {
      return [
        "<sys>&gt; 项目仓库目录</sys>",
        "个人终端主页       状态：<b>已上线</b>（就是你现在用的这个）",
        "AI 应用作品集      状态：规划中",
        "下一个项目         状态：待建设"
      ];
    },
    联系() {
      return [
        "<sys>&gt; 联系通道</sys>",
        "电子邮箱：" + INFO.email,
        "电话号码：" + INFO.phone,
        "也可以继续在这里输入指令，比如「关于」。"
      ];
    },
    我是谁() {
      return ["访客（权限等级：游客 · 只读，但欢迎随便逛）"];
    },
    目录() {
      return ["首页/  关于/  技能/  经历/  项目/  终端/  联系/"];
    },
    彩蛋() {
      return ["<sys>权限不足：访客的最高权限是好奇心，而它已经满级了。</sys>"];
    },
    清屏() { return []; }
  };

  // 英文别名：照顾习惯命令行的访客（技术同学 / 面试官）
  const ALIASES = {
    help: "帮助", "?": "帮助",
    about: "关于",
    stack: "技能", skills: "技能",
    logs: "经历", exp: "经历", experience: "经历",
    projects: "项目",
    contact: "联系",
    whoami: "我是谁",
    ls: "目录",
    sudo: "彩蛋",
    clear: "清屏", cls: "清屏"
  };

  function printLine(html, cls) {
    const div = document.createElement("div");
    div.className = "term-line " + (cls || "out");
    div.innerHTML = html;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }

  function welcome() {
    [
      "<sys>左恩东个人终端 v1.0 —— 输入「帮助」查看全部指令</sys>",
      "这里不是普通的聊天框，而是一台用来认识我的终端。",
      "试试输入：关于、技能、项目 ……"
    ].forEach(l => printLine(l));
  }

  function run(raw) {
    const rawCmd = raw.trim();
    printLine('<span class="cmd-echo">请输入命令 &gt; ' + escapeHtml(rawCmd) + "</span>");
    if (!rawCmd) return;

    // 兼容中文输入法的全角空格
    let key = rawCmd.toLowerCase().replace(/　/g, " ").split(/\s+/)[0];
    key = ALIASES[key] || key;

    if (key === "清屏") { output.innerHTML = ""; return; }

    const fn = COMMANDS[key];
    if (fn) {
      fn().forEach(l => printLine(l));
    } else if (CHAT_API) {
      // 未命中本地命令 → 发给云端 AI 助手（失败自动退回本地提示）
      askCloud(rawCmd);
    } else {
      printLine(
        "<err>找不到这条指令：" + escapeHtml(key) +
        " —— 输入「帮助」看看我能回答什么 :)</err>"
      );
    }
  }

  /* ---- 云端 AI 助手链路 ----
   * 配好云函数后，把地址填进上方 CHAT_API 即自动生效：
   * POST { message, history } → 返回 { reply }
   * history 携带最近 8 轮对话，让 AI 记得住上下文。
   */
  const chatHistory = [];
  function askCloud(msg) {
    printLine('<span class="sys">AI 助手思考中<span class="cursor">▋</span></span>');
    const thinkingLine = output.lastElementChild;
    const t0 = Date.now();

    fetch(CHAT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        history: chatHistory.slice(-16)   // 最近 8 轮（user+assistant 各一条）
      })
    })
      .then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(d => {
        // 兼容 { reply } / { output } / { result } 三种返回格式
        const reply = (d && (d.reply || d.output || d.result)) || "";
        if (thinkingLine && thinkingLine.parentNode) thinkingLine.remove();
        printLine(escapeHtml(String(reply)) || "<err>AI 返回了空回复。</err>");
        chatHistory.push({ role: "user", content: msg },
                         { role: "assistant", content: String(reply) });
      })
      .catch(() => {
        if (thinkingLine && thinkingLine.parentNode) thinkingLine.remove();
        const wait = Math.max(0, 600 - (Date.now() - t0));
        setTimeout(() => {
          printLine("<err>云端助手暂时联系不上（网络或未配置），输入「帮助」试试本地指令。</err>");
        }, wait);
      });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  input.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    run(input.value);
    input.value = "";
    // 通知音效模块：一条终端指令被执行
    document.dispatchEvent(new CustomEvent("fx:terminal-run"));
  });

  // 点击终端任意位置都聚焦输入框
  app.addEventListener("click", () => input.focus());

  // 导航点进 SHELL 时自动聚焦
  document.querySelectorAll('a[href="#terminal"]').forEach(a =>
    a.addEventListener("click", () => setTimeout(() => input.focus(), 550))
  );

  welcome();
})();

/* ---------------------------------------------------------
 * ⑧ 鼠标轨迹粒子 + 点击涟漪
 *    - 移动鼠标：沿轨迹喷出青/紫/绿发光微粒，约 0.7 秒消散
 *    - 点击可交互元素：青色光环扩散 + 粒子爆发
 *    - 点击空白处：灰色小涟漪（与"沉闷音效"对应）
 *    自适应：DPR 适配、粒子上限、无粒子时停帧省电、
 *    触摸端不拖尾只在点按时爆发、尊重减少动效设置
 * ------------------------------------------------------- */
(function cursorFX() {
  /* 点击目标分类：视觉与音效两个模块共用，即使关闭动效也必须可用，故最先注册 */
  function hitType(el) {
    if (!el || !el.closest) return "none";
    if (el.closest("#boot")) return "boot";        // 开机画面点击仅用于跳过，静音无特效
    if (el.closest("#soundToggle")) return "toggle";
    if (el.closest("#termApp")) return "terminal";
    if (el.closest(".btn-primary")) return "primary";
    if (el.closest(".btn")) return "btn";
    if (el.closest(".avatar-wrap")) return "avatar";
    if (el.closest(".tag")) return "tag";
    if (el.closest(".side-link, .nav-link")) return "nav";
    if (el.closest("a[href]")) return "link";
    if (el.closest("input, textarea, select, button")) return "input";
    return "none";
  }
  window.FxHitType = hitType;

  const canvas = document.getElementById("cursorFx");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;   // 减少动效：视觉不启动，但点击分类仍对音效生效

  const CYAN = [56, 225, 255], MAGENTA = [176, 107, 255],
        GREEN = [109, 255, 180], AMBER = [255, 196, 107],
        GRAY = [120, 142, 168];

  const MAX_PARTICLES = 130;
  let W = 0, H = 0, dpr = 1;
  const particles = [], rings = [];
  const mouse = { x: -9999, y: -9999, lastX: 0, lastY: 0, lastT: 0, inside: false };
  let raf = null, running = false;

  /* 各类型的"点击反馈配方"：粒子数 / 颜色 / 涟漪半径 */
  const BURST_RECIPE = {
    primary:  { n: 14, colors: [CYAN, CYAN, MAGENTA], ring: 92,  speed: 3.4 },
    link:     { n: 12, colors: [CYAN, GREEN],             ring: 84,  speed: 3.0 },
    avatar:   { n: 16, colors: [CYAN, MAGENTA, GREEN],    ring: 100, speed: 3.2 },
    btn:      { n: 9,  colors: [CYAN],                    ring: 70,  speed: 2.6 },
    nav:      { n: 8,  colors: [CYAN, CYAN, MAGENTA],     ring: 60,  speed: 2.4 },
    tag:      { n: 7,  colors: [MAGENTA, CYAN],           ring: 54,  speed: 2.2 },
    toggle:   { n: 7,  colors: [AMBER, CYAN],             ring: 56,  speed: 2.3 },
    terminal: { n: 5,  colors: [GREEN],                   ring: 48,  speed: 1.9 },
    input:    { n: 4,  colors: [GREEN],                   ring: 40,  speed: 1.7 },
    none:     { n: 3,  colors: [GRAY],                    ring: 30,  speed: 1.1 }
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(x, y, vx, vy, color, size, life) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push({
      x, y,
      vx: vx + (Math.random() - .5) * .5,
      vy: vy + (Math.random() - .5) * .5,
      life, maxLife: life,
      size: size || (1 + Math.random() * 1.7),
      color,
      glow: Math.random() < .18   // 少量高亮"星火"
    });
  }

  function addRing(x, y, r, color) {
    rings.push({ x, y, r: 4, maxR: r, life: 1, color });
    if (rings.length > 8) rings.shift();
  }

  function burst(x, y, type) {
    if (type === "boot") return;
    const r = BURST_RECIPE[type] || BURST_RECIPE.none;
    const dull = type === "none";
    addRing(x, y, r.ring, dull ? GRAY : r.colors[0]);
    for (let i = 0; i < r.n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (0.6 + Math.random() * r.speed) * (dull ? .45 : 1);
      const color = r.colors[Math.floor(Math.random() * r.colors.length)];
      spawn(x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, color,
            dull ? .8 + Math.random() : 1.1 + Math.random() * 1.8,
            dull ? 26 + Math.random() * 14 : 34 + Math.random() * 24);
    }
    kick();
  }

  function step() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    // 鼠标柔和光晕
    if (mouse.inside) {
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 90);
      g.addColorStop(0, "rgba(56,225,255,.10)");
      g.addColorStop(1, "rgba(56,225,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 90, 0, Math.PI * 2); ctx.fill();
    }

    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life--;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy;
      p.vx *= .95; p.vy *= .95;          // 阻尼，粒子逐渐停住
      const k = p.life / p.maxLife;
      const [r, g, b] = p.color;
      if (p.glow) {
        ctx.save();
        ctx.shadowColor = "rgba(" + r + "," + g + "," + b + ",.9)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (k * .9).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k + .4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (k * .75).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k + .3, 0, Math.PI * 2); ctx.fill();
      }
    }

    // 涟漪
    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i];
      ring.life -= .035;
      if (ring.life <= 0) { rings.splice(i, 1); continue; }
      ring.r += (ring.maxR - ring.r) * .16;
      const [r, g, b] = ring.color;
      ctx.strokeStyle = "rgba(" + r + "," + g + "," + b + "," + (ring.life * .65).toFixed(3) + ")";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";

    if (particles.length || rings.length) {
      raf = requestAnimationFrame(step);
    } else {
      ctx.clearRect(0, 0, W, H);
      raf = null; running = false;
    }
  }

  function kick() {
    if (!running) { running = true; raf = requestAnimationFrame(step); }
  }

  /* ---- 事件绑定 ---- */
  resize();
  window.addEventListener("resize", resize);

  // 轨迹：仅鼠标/触控笔；触摸端不拖尾（避免与页面滚动抢性能）
  window.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const now = performance.now();
    mouse.inside = true;
    const x = e.clientX, y = e.clientY;

    // 按距离沿移动路径补点，快速划动也不会断成一串空洞
    const dx = x - mouse.lastX, dy = y - mouse.lastY;
    const dist = Math.hypot(dx, dy);
    if (now - mouse.lastT < 16 || dist < 5) { mouse.x = x; mouse.y = y; return; }
    mouse.lastT = now;

    const steps = Math.min(6, Math.floor(dist / 12));
    for (let i = 1; i <= steps; i++) {
      const px = mouse.lastX + dx * i / steps;
      const py = mouse.lastY + dy * i / steps;
      const roll = Math.random();
      const color = roll < .78 ? CYAN : roll < .92 ? MAGENTA : GREEN;
      // 初速度沿鼠标运动方向，带一点侧向飘移
      const sp = Math.min(1.6, dist * .03);
      spawn(px, py, dx / (dist || 1) * sp, dy / (dist || 1) * sp,
            color, null, 30 + Math.random() * 22);
    }
    mouse.lastX = x; mouse.lastY = y; mouse.x = x; mouse.y = y;
    kick();
  }, { passive: true });

  window.addEventListener("pointerleave", () => { mouse.inside = false; });

  // 点击：按目标类型爆发涟漪
  window.addEventListener("pointerdown", e => {
    const type = hitType(e.target);
    burst(e.clientX, e.clientY, type);
    // 触摸点按也给一下光晕位置
    if (e.pointerType === "touch") {
      mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true;
      setTimeout(() => { mouse.inside = false; }, 500);
    }
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; running = false; }
  });
})();

/* ---------------------------------------------------------
 * ⑨ Web Audio 分类音效引擎（全部实时合成，零音频文件）
 *    点空白 → 沉闷低频；不同可交互元素 → 不同电子音色；
 *    标签按文字散列到五声音阶，每个标签音高都不一样。
 *    浏览器策略：AudioContext 在首次点击/按键时才创建。
 * ------------------------------------------------------- */
(function soundEngine() {
  const toggleBtn = document.getElementById("soundToggle");
  const toggleText = toggleBtn ? toggleBtn.querySelector(".st-text") : null;
  let enabled = true;
  try { enabled = localStorage.getItem("znd-sound") !== "0"; } catch (err) { /* 隐私模式忽略 */ }

  let actx = null, master = null, noiseBuf = null;

  function syncToggleUI() {
    if (!toggleBtn) return;
    toggleBtn.classList.toggle("is-off", !enabled);
    toggleBtn.setAttribute("aria-pressed", String(enabled));
    if (toggleText) toggleText.textContent = enabled ? "音效 开" : "音效 关";
  }
  syncToggleUI();

  function ensureCtx() {
    if (!enabled) return null;
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = .5;
      master.connect(actx.destination);
      // 预生成 0.3 秒白噪声，供"沉闷"音效复用
      const len = Math.floor(actx.sampleRate * .3);
      noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }

  /* 基础单音：osc + 快速起音/指数衰减包络 */
  function tone(o) {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.freq2) osc.frequency.exponentialRampToValueAtTime(o.freq2, t + o.dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + o.dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + o.dur + .03);
  }

  /* 低通噪声：给沉闷点击加一点"实体感" */
  function noiseThud() {
    const c = ensureCtx(); if (!c) return;
    const t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = noiseBuf;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 220;
    const g = c.createGain();
    g.gain.setValueAtTime(.18, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + .11);
    src.connect(filter); filter.connect(g); g.connect(master);
    src.start(t); src.stop(t + .13);
  }

  /* 五声音阶（宫调）：标签音高池，怎么随机都不刺耳 */
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7];
  function hashFreq(text) {
    let h = 7;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return PENTA[h % PENTA.length];
  }

  /* ---- 每种元素的声音配方 ---- */
  function play(type, el) {
    if (!enabled) return;
    switch (type) {
      case "boot":        // 开机画面点击：静默
        break;
      case "primary":     // 主按钮：两音上行，"确认"
        tone({ freq: 523.25, freq2: 659.25, dur: .09, type: "sine", vol: .2 });
        tone({ freq: 783.99, dur: .14, type: "sine", vol: .18, delay: .08 });
        break;
      case "btn":         // 次按钮：单音轻电子
        tone({ freq: 620, freq2: 560, dur: .09, type: "triangle", vol: .16 });
        break;
      case "nav":         // 导航：短促方波 blip
        tone({ freq: 760, freq2: 680, dur: .055, type: "square", vol: .09 });
        break;
      case "link":        // 联系通道：三音上行琶音，像"建立连接"
        [659.25, 880, 1046.5].forEach((f, i) =>
          tone({ freq: f, dur: .1, type: "sine", vol: .13, delay: i * .055 }));
        break;
      case "tag":         // 技能标签：每个标签有自己的音高
        tone({ freq: hashFreq(el ? el.textContent : ""), dur: .1, type: "triangle", vol: .14 });
        tone({ freq: hashFreq(el ? el.textContent : "") * 2, dur: .07, type: "sine", vol: .05 });
        break;
      case "avatar":      // 头像：柔和铃音
        tone({ freq: 880, dur: .45, type: "sine", vol: .12 });
        tone({ freq: 1318.5, dur: .55, type: "sine", vol: .05, delay: .02 });
        tone({ freq: 1760, dur: .6, type: "sine", vol: .025, delay: .04 });
        break;
      case "toggle":      // 开关：由 flip() 按新状态专门处理
        break;
      case "terminal":    // 终端区域：极轻的聚焦 tick
        tone({ freq: 1250, dur: .03, type: "sine", vol: .06 });
        break;
      case "input":
        tone({ freq: 1100, dur: .03, type: "sine", vol: .05 });
        break;
      case "none":        // 空白处：沉闷的低频下坠 + 闷响
        tone({ freq: 130, freq2: 48, dur: .16, type: "sine", vol: .26 });
        noiseThud();
        break;
    }
  }

  function playRun() {  // 终端回车执行指令
    if (!enabled) return;
    tone({ freq: 660, dur: .06, type: "square", vol: .07 });
    tone({ freq: 990, dur: .09, type: "square", vol: .06, delay: .06 });
  }

  function flip() {
    enabled = !enabled;
    try { localStorage.setItem("znd-sound", enabled ? "1" : "0"); } catch (err) { /* 忽略 */ }
    syncToggleUI();
    if (enabled) {
      ensureCtx();
      tone({ freq: 500, freq2: 920, dur: .12, type: "sine", vol: .18 });  // 开：上扬
    } else {
      tone({ freq: 820, freq2: 380, dur: .14, type: "sine", vol: .16 });  // 关：下沉
    }
  }

  /* ---- 事件 ---- */
  // 首次任意点击/按键即解锁音频（浏览器自动播放策略）
  window.addEventListener("pointerdown", e => {
    const type = window.FxHitType ? window.FxHitType(e.target) : "none";
    if (type === "toggle") { flip(); return; }
    play(type, e.target);
  }, { passive: true });

  if (toggleBtn) {
    // 键盘（Tab 聚焦后按空格/回车）触发的 click：detail === 0
    toggleBtn.addEventListener("click", e => { if (e.detail === 0) flip(); });
  }

  document.addEventListener("fx:terminal-run", playRun);

  /* ---- 导航悬停：轻音效 + 微震动（"碰到"即触发，与点击音效独立） ---- */
  let lastHover = 0;
  function playHover(link) {
    if (!enabled) return;
    const now = performance.now();
    if (now - lastHover < 80) return;   // 节流：快速扫过不轰炸耳朵
    lastHover = now;
    // 每个栏目有自己专属的音高（复用标签散列），音量刻意很轻
    const f = hashFreq(link.textContent || "") * 2;
    tone({ freq: f, dur: .05, type: "sine", vol: .05 });
    tone({ freq: f * 1.5, dur: .04, type: "sine", vol: .02 });
  }
  document.querySelectorAll(".side-link").forEach(a => {
    a.addEventListener("pointerenter", e => {
      if (e.pointerType === "touch") return;   // 触屏没有"悬停"，交给点按
      playHover(a);
      if (navigator.vibrate) navigator.vibrate(8);
    });
    a.addEventListener("pointerdown", () => {
      if (navigator.vibrate) navigator.vibrate(12);   // 手机点按栏目也震一下
    });
  });
})();
