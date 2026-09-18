/** Подгрузка блока отзывов на главной (если есть #home-rv). */
(function () {
  var host = document.getElementById("home-rv");
  if (!host) return;
  fetch("/api/reviews")
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var items = (d && d.items) || [];
      if (!items.length) {
        host.innerHTML = '<p class="reviews-empty">Отзывов пока нет — будьте первым после покупки.</p>';
        return;
      }
      host.innerHTML = items.slice(0, 3).map(function (r) {
        var stars = r.rating ? "★".repeat(r.rating) + "☆".repeat(5 - r.rating) : "";
        return '<article class="review"><div class="review-body"><strong>' + (r.name || "Покупатель") +
          '</strong> ' + (stars ? '<span class="review-stars">' + stars + '</span>' : "") +
          '<p>' + (r.text || "") + '</p></div></article>';
      }).join("");
    })
    .catch(function () {
      host.innerHTML = '<p class="reviews-empty">Отзывы появятся после публикации сайта.</p>';
    });
})();
