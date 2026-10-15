// เลือกก่อนวาดเนื้อหา เพื่อไม่ให้ Hero เปลี่ยนสีตามหลังตอนโหลด
document.currentScript.parentElement.classList.replace('theme-y2k', Math.random() < 0.5 ? 'theme-y2k' : 'theme-pastel');
