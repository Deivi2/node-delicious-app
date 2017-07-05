function autocomplete(input, latInput, lngInput) {
    if (!input) return; //skip that function from running if there is not input on the page
    const dropdawn = new google.maps.places.Autocomplete(input);

    dropdawn.addListener('place_changed', () => {
        const place = dropdawn.getPlace();
        latInput.value = place.geometry.location.lat();
        lngInput.value = place.geometry.location.lng();
    });

    //if some one hist enter on address field dont submit form

    input.on('keydown', (e) => {
        if (e.keyCode === 13) e.preventDefault();
    });

}


export default autocomplete;