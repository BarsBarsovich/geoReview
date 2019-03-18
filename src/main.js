ymaps.ready(initMap);

let address;
let objectId = 0;
let objectManager;
let reviews = [];


function initMap() {
    let myMap = new ymaps.Map('map',
        {
            center: [55.75, 37.61],
            zoom: 8
        },
        {
            suppressObsoleteBrowserNotifier: true,
            yandexMapDisablePoiInteractivity: true,
            suppressMapOpenBlock: true
        }
    );
    objectManager = new ymaps.ObjectManager({
        clusterize: true,
        geoObjectOpenBalloonOnClick: false,
        clusterOpenBalloonOnClick: true,
        clusterDisableClickZoom: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
    });

    myMap.geoObjects.add(objectManager);
    myMap.behaviors.disable(['dblClickZoom']);

    addListeners(myMap);
}


function addListeners(myMap) {
    myMap.events.add('click', event => openModal(event));
    objectManager.objects.events.add(['click'], openModal);


    const closeBtn = document.getElementById('close');

    closeBtn.addEventListener('click', () => {
        const modal = document.querySelector('.modal');
        modal.style.display = 'none';
    })

    const sendButton = document.getElementById('submit');

    sendButton.addEventListener('click', sendForm);
}


function sendForm() {
    const name = document.getElementById('name').value;
    const place = document.getElementById('place').value;
    const emotions = document.getElementById('emotions').value;

    const errors = validateForm(name, place, emotions)
    if (errors.length) {
        alert(errors);
        return
    }

    let placemark = {
        coords: coords,
        address: address,
        objectId: objectId,
        review: {
            name: name,
            place: place,
            emotions: emotions,
            createdAt: new Date().toLocaleDateString()
        }
    }

    addPlacemark(placemark);
    reviews.push(placemark);
    objectId++;
}

function validateForm(name, place, emotions) {
    let errorString = '';
    if (name === '') {
        errorString += 'Введите имя \n\n'
    }

    if (place === '') {
        errorString += 'Введите место \n\n'
    }

    if (emotions === '') {
        errorString += 'Введите отзыв \n\n'
    }

    return errorString;
}

function addPlacemark(placemark) {
    let featuresObj = {
        'type': 'Feature',
        'id': placemark.objectId,
        'geometry': {
            'type': 'Point',
            'coordinates': placemark.coords
        },
        'properties': {
            'balloonContentHeader': `<b>${placemark.review.place}</b>`,
            'balloonContentBody': `<a href="#" class="slider__link">${placemark.address}</a>
                                    <p>${placemark.review.emotions}</p>`,
            'balloonContentFooter': `${placemark.review.createdAt}`,
        }
    };

    objectManager.add({
        'type': 'FeatureCollection',
        'features': [featuresObj]
    });


    document.getElementById('close').dispatchEvent(new Event('click'));
}

function openModal(event) {
    clearInputs();
    event.get('objectId') >= 0 ? openReviews(event) : openEmtyModal(event)
}

function clearInputs() {
    document.getElementById('name').value = '';
    document.getElementById('place').value = '';
    document.getElementById('emotions').value = '';
    document.querySelector('.modal__list').innerHTML = ''
}

function openReviews(event) {
    console.log(reviews);
    const address = getAddressFromReview(event.get('objectId'))
    getReviewsByAddress(address);
}

function getReviewsByAddress(address) {
    reviews.forEach(item => {
        if (item.address === address) {
            createReview(item);
        }
    });

    document.querySelector('.modal').style.display = 'block';
}

function createReview(item) {
    const element = document.createElement('div');
    element.classList.add('modal__item');

    element.innerHTML = `<div class="modal__item-top">` +
        `<span class="modal__item-name">${item.review.name}</span><span class="modal__item-place">${item.review.place}</span><span class="modal__item-place">${item.review.createdAt}</span>`
        + `</div> <p class="modal__item-desc">${item.review.emotions}</p>`

    document.querySelector('.modal__list').appendChild(element);
}


// тут нам надо узнать координаты объекта, вдруг несколько отзывов на нем висят
function getAddressFromReview(objectId) {
    for (let item of reviews) {
        if (item.objectId === objectId) {
            return item.address
        }
    }
}

function openEmtyModal(event) {
    let posX = event.getSourceEvent().originalEvent.domEvent.originalEvent.clientX;
    let posY = event.getSourceEvent().originalEvent.domEvent.originalEvent.clientY;

    coords = event.get('coords');

    getClickCoords(coords)
        .then(result => {
            address = result;
            document.querySelector('.modal__title').innerText = address
            showModal(posX, posY);
        })
        .catch((e) => {
            alert('Повторите запрос позднее');
            console.log(e);
        });
}

function showModal(posX, posY) {
    const modal = document.querySelector('.modal');
    const windowHeight = document.body.clientHeight;
    const windowWidth = document.body.clientWidth;
    const modalHeight = modal.clientHeight;
    const modalWidth = modal.clientWidth;


    if (posX + modalWidth > windowWidth) {
        posX -= modalWidth;
    }

    if (posY + modalHeight > windowHeight) {
        posY -= modalHeight;
    }

    modal.style.left = `${posX}px`;
    modal.style.top = `${posY}px`;
    modal.style.opacity = '1';
}

function getClickCoords(coords) {
    return new Promise((resolve, reject) => {
        ymaps.geocode(coords)
            .then(response => resolve(response.geoObjects.get(0).getAddressLine()))
            .catch(e => reject(e))
    })
}
