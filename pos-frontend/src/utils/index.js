export const getBgColor = () => {
  const bgarr = [
    "#b73e3e",
    "#5b45b0",
    "#7f167f",
    "#735f32",
    "#1d2569",
    "#285430",
    "#f6b100",
    "#025cca",
    "#be3e3f",
    "#02ca3a",
  ];
  const randomBg = Math.floor(Math.random() * bgarr.length);
  const color = bgarr[randomBg];
  return color;
};

export const getAvatarName = (name) => {
  if(!name) return "";

  return name.split(" ").map(word => word[0]).join("").toUpperCase();

}

export const formatDate = (date) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
};

// Tự động lấy timezone của user
export const getUserTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const formatDateAndTime = (date) => {
  // Tự động lấy timezone của user
  const userTimezone = getUserTimezone();
  
  const dateAndTime = new Date(date).toLocaleString("vi-VN", {
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: userTimezone
  })

  return dateAndTime;
}

// Format date đơn giản theo timezone user
export const formatLocalDate = (date) => {
  const userTimezone = getUserTimezone();
  
  return new Date(date).toLocaleString("vi-VN", {
    timeZone: userTimezone
  });
};

// Tạo Order ID ngắn gọn và dễ nhớ
export const generateShortOrderId = (fullOrderId) => {
  if (!fullOrderId) return "N/A";
  
  // Lấy 8 ký tự đầu và chuyển thành uppercase
  const shortId = fullOrderId.substring(0, 8).toUpperCase();
  
  return shortId;
};

// Tạo Order ID từ timestamp (dễ nhớ hơn)
export const generateReadableOrderId = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // 24
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 01-12
  const day = now.getDate().toString().padStart(2, '0'); // 01-31
  const hour = now.getHours().toString().padStart(2, '0'); // 00-23
  const minute = now.getMinutes().toString().padStart(2, '0'); // 00-59
  const second = now.getSeconds().toString().padStart(2, '0'); // 00-59
  
  return `${year}${month}${day}${hour}${minute}${second}`;
};