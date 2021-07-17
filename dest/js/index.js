(() => {
    let main = {
        init: () => {
            main.search();
        },
        search: () => {
            let outputElem = document.getElementsByClassName('output')[0];
            let api = 'https://content.googleapis.com/youtube/v3/search?part=snippet';
            let query = '';

            $('#button').off();
            $('#button').on('click', () => {
                let input = document.getElementById('input');

                if (input.value === '') {
                    return;
                }
                outputElem.innerHTML = 'Loading...';
                query = '&q=' + encodeURIComponent(input.value.trim());

                main.fetchAPI(api + '&key=' + config.apiKey + query)
                    .then(response => {
                        if (response.items.length > 0) {
                            outputElem.innerHTML = '';
                            console.log('1st', response.items);
                            main.output(response.items);
                            return response.items;
                        } else {
                            outputElem.innerHTML = 'No matching videos';
                        }
                    })
                    .then(res => {
                        console.log('2nd', res);
                    })
                    .catch(() => {
                        outputElem.innerHTML = 'Error fetching data';
                    });
            });
        },
        fetchAPI: async (api) => {
            if (api === undefined || api === '') {
                return;
            }

            let response = await fetch(api);
            let json = await response.json();
            return json;
        },
        output: data => {
            let outputElem = document.getElementsByClassName('output')[0];
            let renderElem = (li, tag, attr, data) => {
                let elem = document.createElement(tag);
                elem.classList.add(attr);

                if (tag === 'img') {
                    elem.setAttribute('src', data);
                } else {
                    elem.innerHTML = data;
                }

                li.appendChild(elem);
            }

            if (data === undefined || data === {}) {
                return;
            }

            let ul = document.createElement('ul');
            ul.classList.add('list');
            outputElem.appendChild(ul);

            for (const key in data) {
                let li = document.createElement('li');

                renderElem(li, 'img', 'thumbnail', `${data[key]['snippet']['thumbnails']['default']['url']}`);
                renderElem(li, 'h3', 'title', `${data[key]['snippet']['title']}`);
                renderElem(li, 'p', 'description', `${data[key]['snippet']['description']}`);

                ul.appendChild(li);
            }
        }
    };

    $(document).ready(() => {
        main.init();
    });
})();
