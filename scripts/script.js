const GEOSERVER_URL = "http://localhost:8080/geoserver/";

// config map
let config = {
  drawControl: true,
  minZoom: 2,
  maxZoom: 18,
};
const zoom = 8;

// coordinates (Ireland)
const lat = 53.33260179774514;
const lng = -7.991799869452587;

const map = L.map("map", config).setView([lat, lng], zoom);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);


     // FeatureGroup is to store editable layers
     var drawnItems = new L.FeatureGroup();
     map.addLayer(drawnItems);
     var drawControl = new L.Control.Draw({
         edit: {
             featureGroup: drawnItems
         }
     });
     map.addControl(drawControl);

// modal
document.addEventListener('DOMContentLoaded', () => {
  // Functions to open and close a modal
  function openModal($el) {
    console.log($el);
    $el.classList.add('is-active');
  }

  function closeModal($el) {
    $el.classList.remove('is-active');
  }

  function closeAllModals() {
    (document.querySelectorAll('.modal') || []).forEach(($modal) => {
      closeModal($modal);
    });
  }

  // Add a click event on buttons to open a specific modal
  (document.querySelectorAll('.customize-modal-trigger') || []).forEach(($trigger) => {
    const modal = $trigger.dataset.target;
    const $target = document.getElementById(modal);

    $trigger.addEventListener('click', () => {
      openModal($target);
    });
  });

  // Add a click event on various child elements to close the parent modal
  (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
    const $target = $close.closest('.modal');

    $close.addEventListener('click', () => {
      closeModal($target);
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener('keydown', (event) => {
    if(event.key === "Escape") {
      closeAllModals();
    }
  });
});

// --------------------------------------------------
// sidebar
const menuItems = document.querySelectorAll(".menu-item");
const sidebar = document.querySelector(".sidebar");
const buttonClose = document.querySelector(".close-button");

menuItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    const target = e.target;

    if (
      target.classList.contains("active-item") ||
      !document.querySelector(".active-sidebar")
    ) {
      document.body.classList.toggle("active-sidebar");
    }

    // show content
    showContent(target.dataset.item);

    // add active class to menu item
    addRemoveActiveItem(target, "active-item");
  });
});

// close sidebar when click on close button
buttonClose.addEventListener("click", () => {
  closeSidebar();
});

// remove active class from menu item and content
function addRemoveActiveItem(target, className) {
  const element = document.querySelector(`.${className}`);
  target.classList.add(className);
  if (!element) return;
  element.classList.remove(className);
}

// show specific content
function showContent(dataContent) {
  const idItem = document.querySelector(`#${dataContent}`);
  addRemoveActiveItem(idItem, "active-content");
}

// --------------------------------------------------
// close when click esc
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeSidebar();
  }
});

// close sidebar when click outside
// document.addEventListener("click", (e) => {
//   if (!e.target.closest(".sidebar")) {
//     closeSidebar();
//   }
// });

// --------------------------------------------------
// close sidebar
function closeSidebar() {
  document.body.classList.remove("active-sidebar");
  const element = document.querySelector(".active-item");
  const activeContent = document.querySelector(".active-content");
  if (!element) return;
  element.classList.remove("active-item");
  activeContent.classList.remove("active-content");
}

const countyList = document.querySelector(".county-list");
const locationList = document.querySelector(".location-list");
const locationDetails = document.querySelector(".location-details");
const sidebar_developLand = document.querySelector(".develop-land");
const calculation = document.querySelector(".calculation");

let wfsLayerFromCounty = null;
let wfsLayerFromObjectId = null;
let selectedPolyGeom = null;

let tree = null; // tree to plant

// objectid is used as land_id
const land_id_object = document.getElementById("land-id"); 
const upfront_cost = document.getElementById("upfront_cost"); 

// keep track of the current land id being developed
let land_id = 0; 

// 2d array. Inner array reference:
// 0 - id
// 1 - lat
// 2 - long
// 3 - tree type
let treeArr = [];
let treeMarkerArr = {}; // contains marker object of the tree, sync with treeArr

let count = 0; // to create unique IDs

// set default tree price values respectively: oak, yellow poplar, silver maple ...
let treePriceArr = [140, 55, 90, 35, 16];
// let oakPrice = 140;
// let yellowPoplarPrice = 55;
// let silverMaplePrice = 90;
// let horseChestnutPrice = 35;
// let nativeMulberry = 35;

const tree0 = document.getElementById("tree0");
const tree1 = document.getElementById("tree1");
const tree2 = document.getElementById("tree2");
const tree3 = document.getElementById("tree3");
const tree4 = document.getElementById("tree4");

tree0.value= treePriceArr[0]; 
tree1.value= treePriceArr[1]; 
tree2.value= treePriceArr[2]; 
tree3.value= treePriceArr[3]; 
tree4.value= treePriceArr[4]; 

// wms request
let wmsLayer = L.Geoserver.wms(GEOSERVER_URL + "wms", {
  layers: "ne:pra_state_assets",
})
wmsLayer.addTo(map);

function getWfsLayerFromCounty(county) {

  wfsLayerFromCounty = L.Geoserver.wfs(GEOSERVER_URL + "wfs", {
    // workspace:name
    layers: "ne:pra_state_assets",
    CQL_FILTER: "county=='" + county + "'",
    onEachFeature: function (feature, layer) {
      const newElement = document.createElement('a');
      newElement.className = "panel-block";
      newElement.innerHTML = `
      <span class="panel-icon">
        <i class="fas fa-book" aria-hidden="true"></i>
      </span>
    ` + feature.id;

      // const aElement = document.createElement('a');
      // aElement.className = "block button is-gapless";
      // aElement.innerHTML = feature.properties.address;
      locationList.appendChild(newElement);

      // A Function that will be called once for each
      // created Feature, after it has been created and styled
      layer.on("mouseover", function (e) {

        // bindPopup
        if (feature.properties && feature.properties.county) {
          // layer.bindPopup(feature.properties.name);
          console.warn("feature.properties: ", feature.properties)
          console.warn("feature: ", feature)
          layer.bindPopup(
            "<h2>Object ID: " + feature.properties.objectid + "</h2>" +
            "<h2>Folio: " + feature.properties.folio + "</h2>" +
            "<h2>SP ID: " + feature.properties.sp_id + "</h2>" +
            "<h2>Address: " + feature.properties.address + "</h2>" +
            "<h2>Registered Owner: " + feature.properties.reg_owner + "</h2>" +
            "<br>" +
            "<button class='button is-primary' id='" + feature.properties.objectid + "' onclick=developLand(" + feature.properties.objectid + ")>Develop</button>"
          );
        }
        this.openPopup();

        // style
        this.setStyle({
          fillColor: "#eb4034",
          weight: 2,
          color: "#eb4034",
          fillOpacity: 0.7,
        });
      });

      layer.on("mouseout", function () {
        // this.closePopup();
        // style
        this.setStyle({
          fillColor: "#3388ff",
          weight: 2,
          color: "#3388ff",
          fillOpacity: 0.2,
        });
      });

      layer.on("click", function (e) {
        map.fitBounds(layer.getBounds());

        // const newElement2 = document.createElement('ul');
        // newElement2.innerHTML = `<li>` + feature.properties.address + `</li>`
        //   locationDetails.appendChild(newElement2);
        document.getElementById("objectid").innerHTML = `<strong>Object ID: </strong>` + feature.properties.objectid;
        document.getElementById("folio").innerHTML = `<strong>Folio: </strong>` + feature.properties.folio;
        document.getElementById("sp_id").innerHTML = `<strong>SP ID: </strong>` + feature.properties.sp_id;
        document.getElementById("property_1").innerHTML = `<strong>Property 1: </strong>` + feature.properties.property_1;
        document.getElementById("plan").innerHTML = `<strong>Plan: </strong>` + feature.properties.plan_;
        document.getElementById("english").innerHTML = `<strong>English: </strong>` + feature.properties.english;
        document.getElementById("address").innerHTML = `<strong>Address: </strong>` + feature.properties.address;
        document.getElementById("area_acres").innerHTML = `<strong>Area Acres: </strong>` + feature.properties.area_acres;
        document.getElementById("area_hectares").innerHTML = `<strong>Area Hectares: </strong>` + feature.properties.area_hectares;
        document.getElementById("reg_owner").innerHTML = `<strong>Reg Owner: </strong>` + feature.properties.reg_owner;
        // document.getElementById("art_form").innerHTML = `<strong>Area Acres: </strong>` + feature.properties.area_acres;
        // document.getElementById("art_status").innerHTML = `<strong>Area Acres: </strong>` + feature.properties.area_acres;
        // document.getElementById("art_sum").innerHTML = `<strong>Area Acres: </strong>` + feature.properties.area_acres;
        // document.getElementById("building_use").innerHTML = `<strong>Area Acres: </strong>` + feature.properties.area_acres;
        // document.getElementById("county").innerHTML = `<strong>Area Acres: </strong>` + feature.properties.area_acres;
        // document.getElementById("art_sum").innerHTML = `<strong>Area Acres: </strong>` + feature.properties.area_acres;
        // document.getElementById("art_sum").innerHTML = `<strong>Area Acres: </strong>` + feature.properties.area_acres;

        if (state != 2) {
          nextState();
        }

      });
    }
  })
  wfsLayerFromCounty.addTo(map);
}

function getWfsLayerFromObjectId(objectid) {
  land_id = objectid;
  land_id_object.innerHTML = "Land ID: " + objectid;
  wfsLayerFromObjectId = L.Geoserver.wfs(GEOSERVER_URL + "wfs", {
    request: "GetFeature",
    layers: "ne:pra_state_assets",
    CQL_FILTER: "objectid=='" + objectid + "'",
    onEachFeature: function (feature, layer) {
      map.fitBounds(layer.getBounds());
      selectedPolyGeom = feature.geometry.coordinates[0];
    }
  }).addTo(map);
  
}

// takes in the id of the land to be developed.
function developLand(objectid) {
  if (state != 3) {
    state = 3;
    checkState();
  }
  map.removeLayer(wfsLayerFromCounty);
  getWfsLayerFromObjectId(objectid);
}

function calculate(){
  let total = 0;
  for (let i = 0; i < treeArr.length; i++) {
    switch (treeArr[i].type) {
      case 0:
        total += treePriceArr[0];
        console.log("Oak, price is: " + treePriceArr[0]);
        break;
      case 1:
        total += treePriceArr[1];
        console.log("Yellow Poplar, price is: " + treePriceArr[1]);
        break;
      case 2:
        total += treePriceArr[2];
        console.log("Silver Maple, price is: " + treePriceArr[2]);
        break;
      case 3:
        total += treePriceArr[3];
        console.log("Horse Chestnut, price is: " + treePriceArr[3]);
        break;
      case 4:
        total += treePriceArr[4];
        console.log("Native Red Mulberry, price is: " + treePriceArr[4]);
        break;
      default:
        total += 0;
        console.log("Error occured in calculate(), no tree type found.");
    }
  }
  upfront_cost.innerHTML = "Upfront Investment cost: $" + total;
  calculation.classList.add("is-active");
}

// takes in the type of tree, refer to getTreeName() method.
function setTree(treeToPlant) {
  tree = treeToPlant;
}

function getTreeName(id) {
  switch (id) {
    case 0:
      return "Oak";
      break;
    case 1:
      return "Yellow Poplar";
      break;
    case 2:
      return "Silver Maple";
      break;
    case 3:
      return "Horse Chestnut";
      break;
    case 4:
      return "Native Red Mulberry";
      break;
    default:
      return "unknown";
  }
}

function customizeSaveChanges() {
  treePriceArr[0] = Number(tree0.value);
  treePriceArr[1] = Number(tree1.value);
  treePriceArr[2] = Number(tree2.value);
  treePriceArr[3] = Number(tree3.value);
  treePriceArr[4] = Number(tree4.value);
}

// runs whenever map is clicked, plants tree when right condition is met.
map.on('click', 
	function(e){
		if (tree != null && selectedPolyGeom != null && state == 3) {
      let polygon = L.polygon([selectedPolyGeom]);
      let m = L.marker([e.latlng.lng, e.latlng.lat]);
      console.log(polygon.contains(m.getLatLng()));

		  if (!polygon.contains(m.getLatLng())) {
		    console.log("NOT INSIDE");
		    return;
		  }

		  // generate unique id for marker
		  uid = land_id + "_" + count;

			treeMarkerArr[uid] = L.marker(e.latlng);
      map.addLayer(treeMarkerArr[uid]);

			treeMarkerArr[uid].bindPopup(
			  `<b>Tree</b><br>` +
			  getTreeName(tree) +
			  `<br>
			  <button
			  class="button is-danger"
			  onclick="removeTree('` + uid + `')">
			  <i class="fas fa-trash"></i>
			  </button>`
			);

			let tempObj = {
			  uid: uid,
			  type: tree,
			  lat: e.latlng.lat,
			  lng: e.latlng.lng,
			};
			treeArr.push(tempObj);
			count++;

		}
	});

function removeTree(uid) {
  // remove from both treeArr and treeMarkerArr.
  console.log("Remove tree with UID: " +  uid);
  map.removeLayer(treeMarkerArr[uid]); // removes from treeMarkerArr

  // removes from treeArr
  for (let i = 0; i < treeArr.length; i++) {
    if (treeArr[i].uid == uid) {
      treeArr.splice(i, 1); // 2nd parameter means remove 1 item only
    }
  }
  // console.log("Removed a tree, new array: " + treeArr);

  // display object, for debugging
  // for (let i = 0; i < treeArr.length; i++) {
  //   console.log(treeArr[i]);
  // }

}

// remove all the tree markers as well as tree array.
function removeAllTreeRecords() {
  for (let i = 0; i < treeArr.length; i++) {
    let treeUidToRemove = treeArr[i].uid;
    if (treeUidToRemove) {
      map.removeLayer(treeMarkerArr[treeUidToRemove]); // removes from treeMarkerArr
    }
  }
  treeMarkerArr = [];
  treeArr = [];
}

// states:
// 0 - starting page (display WMS features)
// 1 - display chosen county (display WFS features of selected county)
// 2 - display land details 
// 3 - plant tree tools/calculation (display WFS feature of particular land) 
let state = 0;

function nextState(county) {
  if (county != null) {
    getWfsLayerFromCounty(county);
  }
  state++;
  checkState();
}

function prevState() {
  if (state != 0) {
    state--;
    checkState();
  }
}

function clearMapLayers() {
  if (treeArr.length != 0) {
    removeAllTreeRecords();
  }
  map.removeLayer(wmsLayer);
  map.removeLayer(wfsLayerFromCounty);
  if (wfsLayerFromObjectId != null) {
    map.removeLayer(wfsLayerFromObjectId);
  }
}

function clearActive() {
  countyList.classList.remove("is-active");
  locationList.classList.remove("is-active");
  locationDetails.classList.remove("is-active");
  sidebar_developLand.classList.remove("is-active");
  calculation.classList.remove("is-active");
}

function checkState() {
  console.log(state);
  switch (state) {
    case 0:
      clearMapLayers();
      clearActive();
      map.addLayer(wmsLayer);
      countyList.classList.add("is-active");
      break;
    case 1:
      clearMapLayers();
      clearActive();
      map.addLayer(wfsLayerFromCounty);
      locationList.classList.add("is-active");
      break;
    case 2:
      clearMapLayers();
      clearActive();
      map.addLayer(wfsLayerFromCounty);
      locationDetails.classList.add("is-active");
      break;
    case 3:
      clearMapLayers();
      clearActive();
      sidebar_developLand.classList.add("is-active");
      break;

    default:
      break;
  }
}
