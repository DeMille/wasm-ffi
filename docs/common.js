if (typeof WebAssembly === 'undefined') {
  document.getElementById('warning-header').classList.remove('hidden');
}

function toArray(list) {
  return Array.prototype.slice.call(list);
}

// tab switching
toArray(document.querySelectorAll('.tabnav-tab')).forEach(function(tab) {
  if (!tab.dataset.target) return;

  var target = tab
    .parentElement // .tabnav-tabs
    .parentElement // .tabnav
    .parentElement // .col
    .querySelector(`[data-tab="${tab.dataset.target}"]`);

  var targets = toArray(target.parentElement.querySelectorAll('[data-tab]'));
  var otherTabs = toArray(tab.parentElement.children);

  tab.addEventListener('click', function() {
    target.classList.remove('hidden');
    tab.classList.add('selected');

    otherTabs.forEach(function(other) {
      if (other !== tab) {
        other.classList.remove('selected');
      }
    });

    targets.forEach(function(other) {
      if (other !== target) {
        other.classList.add('hidden');
      }
    });
  });
});
