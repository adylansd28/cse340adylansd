const form = document.querySelector("#updateForm")
const updateBtn = form.querySelector("button[type='submit']")

form.addEventListener("input", () => {
  updateBtn.removeAttribute("disabled")
})