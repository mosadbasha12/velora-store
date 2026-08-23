// Reviews are optional: no field is required before publishing a rating.
const relaxReviewFields = () => {
  document.querySelectorAll('.comment-form').forEach(form => {
    form.noValidate = true;
    form.querySelectorAll('[required]').forEach(field => field.removeAttribute('required'));
  });
};
const reviewHost = document.getElementById('dynamicPage');
if (reviewHost) new MutationObserver(relaxReviewFields).observe(reviewHost, { childList: true, subtree: true });
document.addEventListener('click', relaxReviewFields, true);
