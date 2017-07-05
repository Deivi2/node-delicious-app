import axios from 'axios';
import {$} from './bling';

//test
const mapOptions = {
    center: {lat: 43.2, lng: -79.8},
    zoom: 8
};


function loadPlace(map, lat = 43.2, lng = -79.8) {
    axios.get(`/api/stores/near/?lat=${lat}&lng=${lng}`)
        .then(res => {
            const places = res.data;
            if (!places.length) {
                alert('no places found');
                return;
            }

            //create a bounds that will zoom map for good position
            const bounds = new google.maps.LatLngBounds();
            //on click bound show info window
            const infoWindow = new google.maps.InfoWindow();

            //make red markers on map
            const markers = places.map(place => {
                //here we herring lng and lat
                const [placeLng, placeLat] = place.location.coordinates;
                const position = {lat: placeLat, lng: placeLng};
                bounds.extend(position);
                const marker = new google.maps.Marker({
                    map: map,
                    position: position
                });
                marker.place = place;
                return marker;
            });

            //when someone clicks on a marker, show the details of that place
            markers.forEach(marker => marker.addListener('click', function () {
                // console.log(this); //this is also looped marker marker

                const html = `
                        <div class="popup">
                            <a href="/store/${this.place.slug}">
                              <img src="/uploads/${this.place.photo || 'store.png'}" alt="this.place.name"> </img>
                              <p>${this.place.name} - ${this.place.location.address}</p>
                            </a>                        
                        </div>
                `;
                infoWindow.setContent(html);
                infoWindow.open(map, this);
            }));


            // zoom the map to fit all the markers perfectly
            map.setCenter(bounds.getCenter());
            map.fitBounds(bounds);
        });
}


function makeMap(mapDiv) {
    if (!mapDiv) return;
    //make our map
    const map = new google.maps.Map(mapDiv, mapOptions);
    loadPlace(map);
    // element from map.pug
    const input = $('[name="geolocate"]');
    //to make autocomplete on it
    const autocomplete = new google.maps.places.Autocomplete(input)
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        let lat = place.geometry.location.lat(); let lng = place.geometry.location.lng();
        loadPlace(map, lat, lng)
    })
}

export default makeMap;