// ==UserScript==
// @name        Tux3's 8chan X
// @version     1.4
// @namespace   8chan-X
// @description Small userscript to improve 8chan
// @match       *://8chan.co/*
// @run-at      document-end
// @grant       none
// @updateURL 	 https://github.com/tux3/8chan-X/raw/master/8chan-x.meta.js
// @downloadURL  https://github.com/tux3/8chan-X/raw/master/8chan-x.user.js
// ==/UserScript==

/*********
GLOBALS
*********/
var originalPageTitle = document.title;
var unreadPosts = [];

/**************************************
MENU BAR
**************************************/
function getStyleName() {
  var matches = document.URL.match(/\/(\w+)\/($|res\/\d+\.html|index\.html|res\/\d+\+50\.html)/);
  var board_name;
  var style;
  if (matches) {
    board_name = matches[1];
  }
  if (!localStorage.board_stylesheets) {
    localStorage.board_stylesheets = '{}';
  }
  window.stylesheet_choices = JSON.parse(localStorage.board_stylesheets);
  if (board_name && stylesheet_choices[board_name]) {
    for (var styleName in styles) {
      if (styleName == stylesheet_choices[board_name]) {
        style = styleName;
        break;
      }
    }
  }
  return style;
}

function updateMenuStyle() {
  var menu = document.getElementsByClassName("boardlist")[0];
  var style = getStyleName();
  if (style == "Yotsuba")
    menu.style.backgroundColor = "#F5C5B5";
  else if (style == "Yotsuba B")
    menu.style.backgroundColor = "#CDD2E6";
  else
    menu.style.backgroundColor = "#333";
}

function updateMenuStats() {
  var stats = document.getElementById("menuStats");
  var nPosts = document.getElementsByClassName("post reply").length+1;
  var nImages = document.getElementsByClassName("post-image").length;
  stats.innerHTML = "["+nPosts+" / "+nImages+"]";
}

function initMenu() {
  // Customize the menu
  var menu = document.getElementsByClassName("boardlist")[0];
  menu.style.textAlign = 'center';
  menu.style.position = 'fixed';
  menu.style.top = '0px';
  menu.style.left = '-8px';
  menu.style.width = "100%";
  menu.style.marginTop = "0px";
  menu.style.padding = "3px";
  updateMenuStyle();
  document.querySelector('[data-description="1"]').style.display = 'none';
  document.querySelector('[data-description="2"]').style.display = 'none';
  
  var nPosts = document.getElementsByClassName("post reply").length+1;
  var nImages = document.getElementsByClassName("post-image").length;
  var statsNode=document.createElement("SPAN");
  var statsTextNode=document.createTextNode("["+nPosts+" / "+nImages+"]");
  statsNode.appendChild(statsTextNode);
  statsNode.id = 'menuStats';
  menu.appendChild(statsNode);
  
  // Hook style changes to update the menu's style
  var styles = document.getElementsByClassName("styles")[0].childNodes;
  for(i=0; i<styles.length; i++) {
      styles[i].onclick = function () {
        changeStyle(this.innerHTML.substring(1, this.innerHTML.length - 1), this);
        updateMenuStyle();
    };
  }
    
}


/***************************************
KEYBOARD EVENTS
***************************************/
document.addEventListener('keydown', function(event) {
  var activeElem = document.activeElement;
  
  // Most events should be ignored if we're just trying to write text
  if (activeElem.nodeName == "INPUT"
     || activeElem.nodeName == "TEXTAREA")
    return;
  
  if (event.keyCode === event.DOM_VK_R) {
      document.location.reload(); 
  }
});


/*******************************************
UNREAD POSTS
*******************************************/
// Returns true if we've just read a new post, and remove it
function checkFirstUnread() {
  if (unreadPosts.length == 0)
    return false;
  
  var postId = unreadPosts[0];
  var post = $("#reply_"+postId);
  if ($(window).scrollTop() + $(window).height() >= post.position().top + post.height())
  {
    unreadPosts.shift();
    return true;
  }
  else
    return false;
}
function checkUnreadPosts() {  
  while (checkFirstUnread());
  
  if (unreadPosts.length != 0)
    document.title = "("+unreadPosts.length+") "+originalPageTitle;
  else
    document.title = originalPageTitle;
}

// Handler when a new post is fetched by the inline extension
$(document).on('new_post', function (e, post) {
  var postId = $(post).attr('id').replace(/^reply_/, '');
  unreadPosts[unreadPosts.length] = postId;
  //alert(unreadPosts);
  updateMenuStats();
  checkUnreadPosts();
});

// Prepare initial unread posts
function initUnreadPosts() {
  // First mark all posts as unread
  $('.post.reply').each( function (index, data) {
    var postId = $(this).attr('id').replace(/^reply_/, '');
    unreadPosts[unreadPosts.length] = postId;
  });
  checkUnreadPosts();
  
  $(window).scroll(function() {
   checkUnreadPosts();
  });
}

/************
IMAGE HOVER
************/
function initImageHover() {
  $('.post-image').each( function (index, data) {
    if ($(this).parent().data("expanded") != "true")
    {
      $(this).mousemove(function(e) {
        var picUrl = $(this).attr("src");
        var picTimestamp = picUrl.substr(picUrl.indexOf("/thumb/")+7);
        var picTimestamp = picTimestamp.substr(0, picTimestamp.indexOf("."));
        var picId = "post-image-"+picTimestamp;
        var hoverPic = $("#"+picId);
        // Create the hovering image if needed, otherwise just update it's position
        if (!hoverPic.length)
        {
          var newpic = $(this).clone();
          newpic.attr("id",picId);
          newpic.css('display', 'block').css('position', 'absolute').css('z-index', '100');
          newpic.attr("src",picUrl.replace("/thumb/","/src/"));
          newpic.css('left', e.pageX).css('top', top);
          newpic.css('width', 'auto').css('height', 'auto');
          newpic.css('pointer-events','none');
          newpic.css('max-height',$(window).height());
          newpic.css('max-width',$(window).width());
          newpic.insertAfter($(this));
        }
        else
        {
          var scrollTop = $(window).scrollTop();
          var epy = e.pageY;
          var top = epy;
          if (epy < scrollTop + 15) {
            top = scrollTop;
          } else if (epy > scrollTop + $(window).height() - hoverPic.height() - 15) {
            top = scrollTop + $(window).height() - hoverPic.height() - 15;
          }
          hoverPic.css('left', e.pageX).css('top', top);
        }
      });
      $(this).mouseout(function() {
        // Delete the hovering image
        var picUrl = $(this).attr("src");
        var picTimestamp = picUrl.substr(picUrl.indexOf("/thumb/")+7);
        var picTimestamp = picTimestamp.substr(0, picTimestamp.indexOf("."));
        var picId = "post-image-"+picTimestamp;
        var hoverPic = $("#"+picId);
        if (hoverPic.length)
          hoverPic.remove();
      });
      $(this).click(function() {
        // Delete the hovering image
        var picUrl = $(this).attr("src");
        var picTimestamp = picUrl.substr(picUrl.indexOf("/thumb/")+7);
        var picTimestamp = picTimestamp.substr(0, picTimestamp.indexOf("."));
        var picId = "post-image-"+picTimestamp;
        var hoverPic = $("#"+picId);
        if (hoverPic.length)
          hoverPic.remove();
      });
    }
  });
}

/*********
INIT
*********/
function addLoadEvent(func) {
  var oldonload = window.onload;
  if (typeof window.onload != 'function') {
    window.onload = func;
  } else {
    window.onload = function() {
      if (oldonload) {
        oldonload();
      }
      func();
    }
  }
}
// When all is loaded
addLoadEvent(initMenu); // Must wait until the right CSS is loaded to adapt to it
// As soon as the DOM is ready
$( document ).ready(function() {
  initUnreadPosts();
  initImageHover();
});
