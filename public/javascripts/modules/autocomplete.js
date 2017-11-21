function autocomplete( input, latInput, lngInput ) {
  const dropdown = new google.maps.places.Autocomplete(input);
  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
  });
  input.on('keydown', (e) => {
    if(e.keyCode === 13) { // ENTER
      e.preventDefault(); // prevent form submit
    }
  });

}

export default autocomplete;
