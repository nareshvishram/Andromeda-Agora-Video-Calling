const APP_ID = "f912d15072494a62b85a1720b7755e43";
//name of the channel => get it from the session we established in looby.html script
const CHANNEL = sessionStorage.getItem("CHANNEL");
//need to refresh in each 24hr for now => but we have added it in the dynamic
const TOKEN = sessionStorage.getItem("TOKEN");

//unique user id. Either create or .join() will assing it to you
let UID = Number(sessionStorage.getItem("UID"));

//member name -> get it from the session which was set inside lobby.html
let memberName = sessionStorage.getItem("NAME");

//creating a client with mode and encoding as vp8
//AgoreRTC is an interface which have several methods
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

//this will store the audi and vedio tracks of the local user which was captured by microphone and video
//[0] -> audioTrack and [1] -> video track
let localtracks = [];

let remoteUsers = {};

let joinAndDisplayLocalStream = async () => {
  //set the room name as soon as user entered in the room
  document.getElementById("room-name").innerText = CHANNEL;
  //handle the event here when a user join the meeting remotely.
  client.on("user-published", handleUserJoinedRemotely);

  /**
   * This event Occurs when a remote user becomes offline
   */
  client.on("user-left", handleUserLeft);

  //use try-catch to avoid any exception. There may be a chance that CHANNEL or TOKEN or any of them are missing
  try {
    //Allows a user to join the channel. User's in the same channel can talk to each others
    //so that users can communicate to each others
    await client.join(APP_ID, CHANNEL, TOKEN, UID);
  } catch (error) {
    console.error(error);
  }

  //Creates an audio track and a video track.
  //Creates an audio track from the audio sampled by a microphone and a video track from the video captured by a camera.
  //this function will require audio and video access at the same time. User only need to authorize once.
  localtracks = await AgoraRTC.createMicrophoneAndCameraTracks();

  let member = await createMember();
  console.log("member", member);
  //making a dynamic video-block for each seperate user with their seperate UID.
  let player = `<div  class="video-container" id="user-container-${UID}">
                     <div class="video-player" id="user-${UID}"></div>
                     <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                  </div>`;

  //get the DOM element where we want to place the player or the video block and add the payer to their adjacent html.
  document.getElementById("video-streams").insertAdjacentHTML("beforeend", player);

  //now we have to play the video track using a .play() method inside videotrack.
  //.play will take the DOM element where it will got and search the element with user-UID and play the video there.
  //If my UID=123 then it will go to the video-container with id=user-123 and play his video there.
  localtracks[1].play(`user-${UID}`);

  //Publishes local audio and/or video tracks to a channel.
  //take inputs in array
  //publich video and audio from locaktracks
  await client.publish([localtracks[0], localtracks[1]]);
};

/*
How to join multiple users?
1. An event is fired when a user join remotely.client.on("user-published", handleJoinedUser)
 - the handleJoinedUser will take two args async (user, mediaType). 
2. Now we need to add the user with it's user id to the remoteUser object.
3. Subscribe the user's audio and vedio tracks by await client.subscribe(user,mediaType)
  - Now we have to show that user's vdeio and audio on our html page
4. Now check what is media type and play accordigly.
 - here we'll use .play() function from user.videoTrack and user.audioTrack.
 - Before doing so please check whether the video track already there or not?
 - If there then remove it first and then add. There may be chance that user just refreshed the page 
  or left, so there will be many windows for that. So to avoid adding multiple times, just remove it first.
 */

let handleUserJoinedRemotely = async (user, mediaType) => {
  remoteUsers[user.uid] = user;
  console.log("user added to remote user object");
  //subscribe the remote user to play the audio and video tracks
  await client.subscribe(user, mediaType);

  //check for media type
  if (mediaType == "video") {
    console.log("Media type is video!!");
    //get the container with this uid and check whether it's already there or not? If there then remove and then play
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player != null) {
      //already there
      player.remove();
    }
    //Now add the video window or block for this remote user.
    let remoteMemberName = await getRemoteMemberName(user);
    console.log("remoteMembername@@", remoteMemberName);
    player = `<div  class="video-container" id="user-container-${user.uid}">
                     <div class="video-player" id="user-${user.uid}"></div>
                     <div class="username-wrapper"><span class="user-name">${remoteMemberName.member}</span></div>
                  </div>`;
    //get the DOM element where we want to place the player or the video block and add the payer to their adjacent html.
    document.getElementById("video-streams").insertAdjacentHTML("beforeend", player);
    //Now play
    user.videoTrack.play(`user-${user.uid}`);
  }
  if (mediaType == "audio") {
    console.log("Media Type is audio!!");
    //play the audio too.
    user.audioTrack.play(`user-${user.uid}`);
  }
};

let handleUserLeft = async (user) => {
  console.log("User is leaving..........");
  //remote the left user's id and details from the remote-user object
  delete remoteUsers[user.uid];
  //remove user from the DOM or remove the block from the html.
  let player = document.getElementById(`user-container-${user.uid}`);
  player.remove();
  deleteMember();
};

//function to handle leave button
let leaveAndRemoveLocalStream = async () => {
  //loop through all the localTracks and stop + close them
  for (let i = 0; i < localtracks.length; i++) {
    /*
    - .close() and .stop() are function of audioTrack and videoTrack
     */
    // first Stops playing the media track.
    localtracks[i].stop();

    /**
     * - close the stopped media track
     * - This .close() Closes a local track and releases the audio and video resources that it occupies.
     * - Once you close a local track, you can no longer reuse it.
     */
    localtracks[i].close();
  }

  //when the user leaves the call
  await client.leave();
  //go to lobby or home with the same tab
  window.open("/", "_self");
};

//handle camera toggle
let handleCameraToggle = async (e) => {
  if (localtracks[1].muted) {
    console.log("Already Muted");
    //unmute the camera
    localtracks[1].setMuted(false);
    //set the button color to white when it's not muted
    e.target.style.backgroundColor = "#fff";
  } else {
    console.log("Not Muted");
    //nmute the camera
    localtracks[1].setMuted(true);
    //set the button color to red when it's muted
    e.target.style.backgroundColor = "rgb(255,80,80,1)";
  }
};

//handle mic toggle
let handleMicToggle = async (e) => {
  if (localtracks[0].muted) {
    console.log("Already Muted");
    //unmute the mic
    localtracks[0].setMuted(false);
    //set the button color to white when it's not muted
    e.target.style.backgroundColor = "#fff";
  } else {
    console.log("Not Muted");
    //nmute the mic
    localtracks[0].setMuted(true);
    //set the button color to red when it's muted
    e.target.style.backgroundColor = "rgb(255,80,80,1)";
  }
};

//for creating a member to show user's name
let createMember = async () => {
  console.log("@@", memberName, UID, CHANNEL);
  //do a post request to our createMember method inside views.py
  let response = await fetch("/create_member/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: memberName, UID: UID, room_name: CHANNEL }),
  });
  let member = await response.json();
  return member;
};

//get remote member's name from the db
let getRemoteMemberName = async (user) => {
  let response = await fetch(`/get_remote_member/?UID=${user.uid}&ROOM_NAME=${CHANNEL}`);
  let remoteMemberName = await response.json();
  return remoteMemberName;
};

//for deleting a member to show user's name
let deleteMember = async () => {
  console.log("@@", memberName, UID, CHANNEL);
  //do a post request to our createMember method inside views.py
  let response = await fetch("/delete_member/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: memberName, UID: UID, room_name: CHANNEL }),
  });
  let member = await response.json();
};

window.addEventListener("beforeunload", deleteMember);

//event when leave button is clicked
document.getElementById("leave-btn").addEventListener("click", leaveAndRemoveLocalStream);

//event when camera button is toggled
document.getElementById("camera-btn").addEventListener("click", handleCameraToggle);

//event when mic button is toggled
document.getElementById("mic-btn").addEventListener("click", handleMicToggle);

//call the function whenever this js file is loaded
joinAndDisplayLocalStream();
