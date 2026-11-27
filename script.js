const menuButton = document.querySelector("[data-menu-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const header = document.querySelector("[data-header]");

menuButton?.addEventListener("click", () => {
  const isOpen = mobileMenu.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "메뉴 열기");
  });
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    const offset = header?.offsetHeight ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - offset + 1;
    window.scrollTo({ top, behavior: "smooth" });
  });
});

// 빠른 상담 신청 폼: 정적 사이트에서도 원장님 메일(mjh0119@gmail.com)로 바로 전송합니다.
const CONSULT_EMAIL = "mjh0119@gmail.com";
const CONSULT_ENDPOINT = `https://formsubmit.co/ajax/${CONSULT_EMAIL}`;
const consultForm = document.querySelector("[data-consult-form]");
const consultStatus = consultForm?.querySelector("[data-form-status]");
const consultButton = consultForm?.querySelector('button[type="submit"]');
const consultButtonLabel = consultButton?.textContent ?? "상담 신청하기";

function setConsultStatus(message, state) {
  if (!consultStatus) return;
  consultStatus.hidden = false;
  consultStatus.dataset.state = state;
  consultStatus.innerHTML = message;
}

function consultValue(name) {
  const field = consultForm?.elements.namedItem(name);
  return typeof field?.value === "string" ? field.value.trim() : "";
}

consultForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (consultValue("_honey")) {
    // 스팸 봇이 채우는 숨은 칸입니다. 조용히 넘깁니다.
    setConsultStatus("상담 신청이 접수되었습니다. 확인 후 순차적으로 연락드리겠습니다.", "success");
    consultForm.reset();
    return;
  }

  const payload = {
    이름: consultValue("name"),
    학년: consultValue("grade"),
    연락처: consultValue("phone"),
    문의내용: consultValue("message") || "(미입력)",
    _subject: "유베스트영어 홈페이지 상담 신청",
    _template: "table",
    _captcha: "false",
  };

  consultButton.disabled = true;
  consultButton.textContent = "전송 중...";
  setConsultStatus("상담 신청을 보내고 있습니다. 잠시만 기다려 주세요.", "pending");

  try {
    const response = await fetch(CONSULT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);
    const failed =
      !response.ok ||
      !result ||
      String(result.success).toLowerCase() === "false";

    if (failed) {
      throw new Error(result?.message || `HTTP ${response.status}`);
    }

    consultForm.reset();
    setConsultStatus(
      "상담 신청이 접수되었습니다. 확인 후 순차적으로 연락드리겠습니다.",
      "success",
    );
  } catch (error) {
    setConsultStatus(
      `전송에 실패했습니다. 잠시 후 다시 시도하시거나 <a href="mailto:${CONSULT_EMAIL}">이메일(${CONSULT_EMAIL})</a> 또는 <a href="tel:010-3292-2330">전화·문자(010-3292-2330)</a>로 문의해 주세요.`,
      "error",
    );
  } finally {
    consultButton.disabled = false;
    consultButton.textContent = consultButtonLabel;
  }
});
