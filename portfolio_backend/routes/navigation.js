// navigation.js	
function openNav() {
  document.getElementById("mySidenav").style.width = "400px";
  document.getElementById("mySidenav").style.zIndex = "10";
  document.getElementById("mySidenav").style.zIndex = "4000";
  }

  function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  }


  document.addEventListener("click", (event) => {
  if (
      document.getElementById("nbtn").contains(event.target) ||
      document.getElementById("mySidenav").contains(event.target)
  ) {
      return;
  }
  closeNav();
  });
  document.getElementById('nbtn').addEventListener('click', openNav);
  document.querySelector('.closebtn').addEventListener('click', closeNav);