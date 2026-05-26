const items = document.querySelectorAll(".sidebar li");

items.forEach(item => {
  item.addEventListener("click", () => {
    alert(item.innerText + " clicked");
  });
});
