// เลือกก่อนวาดเนื้อหา เพื่อไม่ให้ Hero เปลี่ยนสีตามหลังตอนโหลด
document.currentScript.parentElement.classList.replace('theme-y2k', ['theme-y2k', 'theme-pastel', 'theme-illustrated'][Math.floor(Math.random() * 3)]);
