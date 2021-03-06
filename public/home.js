


$('.toggleForms').click(function() {
    $("#signUpForm").toggle();
    $("#signInForm").toggle();
    $("#showSignUpForm").toggle();
    $("#showSignInForm").toggle();
})


const form = document.getElementById("signUpForm");
const signUpButton = document.getElementById("signUpButton");
const modalText = document.getElementById("modalText");
const modalTitle = document.getElementById("modalTitle");
const modalConfirm = document.getElementById("confirm");
const modalCancel = document.getElementById("cancel");
const signInButton = document.getElementById("signInButton");
const stayLoggedInSignUp = $("#stayLoggedInSignUp");
const stayLoggedInSignIn = $("#stayLoggedInSignIn");

signInButton.onclick = function(event) {
  event.preventDefault();

  const studentid = document.getElementById("signInId").value;
  const password = document.getElementById("signInPassword").value;
  let stayLoggedIn = false;

  if (stayLoggedInSignIn.is(':checked')) {
    stayLoggedIn = true;
  }

  console.log(stayLoggedIn);


  $.ajax({
    url: '/signin',
    method: 'POST',
    data: {
      studentid: studentid,
      password: password,
      stayLoggedIn: stayLoggedIn,
    },
    success: function (response, textStatus, xhr) {
      window.location = `/profile`
    },
    error: function (response, textStatus, xhr) {
      if(response.status == 400) {
        alert("Sign in failed, please try again later.")
      }
    }
  });

}

modalConfirm.onclick = function() {
    const name = document.getElementById("signUpName").value;
    const studentid = document.getElementById("signUpId").value;
    const department = document.getElementById("department").value;
    const password = document.getElementById("signUpPassword").value;
    let stayLoggedIn = false;

    if (stayLoggedInSignUp.is(':checked')) {
      stayLoggedIn = true;
    }
    
    $.ajax({
    url: '/signup',
    method: 'POST',
    data: {
      name: name,
      studentid: studentid,
      department: department,
      password: password,
      stayLoggedIn: stayLoggedIn,
    },
    success: function (response, textStatus, xhr) {
        console.log(response);
        window.location = `/profile`
    },
    error: function (response, textStatus, xhr) {
      if(response.status == 400) {
        if(response.responseJSON.errmsg && response.responseJSON.errmsg.includes("E11000 duplicate key error collection")) {
          return alert("There is already a user with the same student id in the database.")
        }
        alert("Sign up failed, please try again later.")
      }
    }
    });

}


signUpButton.onclick = function(e) {

    e.preventDefault();

    // reset the modal buttons to default (in case they were changed by the error modal if statement)
    modalCancel.innerHTML="Cancel";
    modalConfirm.style.display = "initial";

    const name = document.getElementById("signUpName").value;
    const studentid = document.getElementById("signUpId").value;
    const department = document.getElementById("department").value;
    const password = document.getElementById("signUpPassword").value;

    let warningText = "";

    if(!studentid) {
        warningText += "ID is required<br>"
    }
    if(!name) {
        warningText += "Name is required<br>";
    }
    if(!department) {
        warningText += "Department is required<br>";
    }
    if(!password) {
        warningText += "Password is required<br>";
    }
    if(password.length < 6) {
      warningText += "Password should be at least 6 characters long<br>"
    }
    if(warningText != "") {
        // change html so that there is only one dismiss button when prompting for missing fields
        modalCancel.innerHTML="Dismiss";
        modalConfirm.style.display = "none";

        modalTitle.innerHTML = "Error";
        modalText.innerHTML = "There were some errors in your form:<br>" + warningText;

    } else {
        modalTitle.innerHTML = "Please confirm your details";
        modalText.innerHTML = `Your student ID is: ${studentid}<br>Your name is: ${name}<br>You are in the Department of ${department}`;
    }

}
