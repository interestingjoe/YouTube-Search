(() => {
    let main = {
        api: 'https://content.googleapis.com/youtube/v3/',
        paramPart: 'part=snippet',
        outputElem: document.getElementsByClassName('output')[0],
        init: () => {
            main.setEvent();
        },

        /**
         * Add Event Listener for SEARCH and CLEAR buttons.
         */
        setEvent: () => {
            $('#search').off();
            $('#search').on('click', () => {
                let input = document.getElementById('input');

                if (input.value === '') {
                    return;
                }

                main.createMessage('status', 'Loading...');
                let url = `${main.api}search?${main.paramPart}&key=${config.apiKey}&q=${encodeURIComponent(input.value.trim())}`;
                main.fetchPromise(url);
            });

            $('#clear').off();
            $('#clear').on('click', () => {
                main.outputElem.innerHTML = '';
                document.getElementById('input').value = '';
            });
        },

        /**
         * Fetch API with a Promise.
         * @param {*} url 
         */
        fetchPromise: url => {
            main.fetchAPI(url)
                .then(response => {
                    // Initial fetch
                    if (response.items.length > 0) {
                        main.outputElem.innerHTML = '';
                        main.output(response, url);
                        return response.items;
                    } else {
                        main.createMessage('warning', 'No matching videos');
                    }
                })
                .then(async response => {
                    // Fetches Video Tags
                    let arr = [];
                    for (const key in response) {
                        if (response[key]['id']['videoId'] === undefined) {
                            continue;
                        }
                        let url = `${main.api}videos?${main.paramPart}&key=${config.apiKey}&id=${response[key]['id']['videoId']}`;
                        let item = await main.fetchAPI(url);
                        arr.push(item);
                    }
                    return await Promise.all(arr);
                })
                .then(response => {
                    if (response.length > 0) {
                        // If Video Tags exists then render onto page.
                        for (const key in response) {
                            if (
                                response[key]['items'][0]['id'] === undefined || 
                                (response[key]['items'][0]['snippet']['tags'] === undefined || response[key]['items'][0]['snippet']['tags'] === [])
                            ) {
                                // If one or more Video Tags don't exist then display message in Console Log.
                                console.log('One or more items don\'t have available tags.');
                                continue;
                            }
                            let p = document.createElement('p');
                            p.classList.add('tags');
                            let copy = response[key]['items'][0]['snippet']['tags'];
                            p.innerHTML = '<strong>Video Tags:</strong> ' + copy.join(', ');

                            let li = document.querySelector(`[data-id='${response[key]['items'][0]['id']}'`);
                            li.appendChild(p);
                        }
                    } else {
                        // If Video Tags don't exist then display message.
                        if (document.getElementsByClassName('list')[0] === undefined) {
                            return;
                        }

                        main.createMessage('warning', 'No available tags');
                    }
                })
                .catch(() => {
                    main.createMessage('error', 'Error fetching data');
                });
        },

        /**
         * Basic Async/Await function.
         * @param {*} api 
         * @returns json
         */
        fetchAPI: async (api) => {
            if (api === undefined || api === '') {
                return;
            }
            let response = await fetch(api);
            return response.json();
        },
        
        /**
         * Used to display Status or Error Messages in the output.
         * @param {*} className 
         * @param {*} copy 
         */
        createMessage: (className, copy) => {
            let p = document.createElement('p');
            p.classList.add(className);
            p.innerHTML = copy;
            main.outputElem.innerHTML = '';
            main.outputElem.appendChild(p);
        },

        /**
         * Creating PREV and NEXT buttons if they're available.
         * @param {*} data 
         * @param {*} url 
         */
        pagination: (data, url) => {
            /**
             * Used to render each button and attaches an Event Listener.
             * @param {*} copy 
             * @param {*} attr 
             * @param {*} param 
             */
            let createButton = (copy, attr, param) => {
                let button = document.createElement('button');
                button.setAttribute('id', attr);
                button.innerHTML = copy;
                div.appendChild(button);

                $(`#${attr}`).off();
                $(`#${attr}`).on('click', (e) => {
                    e.preventDefault();
                    main.createMessage('status', 'Loading...');
                    main.fetchPromise(`${url}&pageToken=${param}`);
                });
            }

            let div = document.createElement('div');
            div.classList.add('pagination');
            main.outputElem.appendChild(div);

            if (data.prevPageToken !== undefined) {
                createButton('PREVIOUS', 'prev', data.prevPageToken);
            }
            if (data.nextPageToken !== undefined) {
                createButton('NEXT', 'next', data.nextPageToken);
            }
        },
        
        /**
         * Render output dynamically.
         * @param {*} data 
         * @param {*} url 
         */
        output: (data, url) => {
            let dataItems = data.items;

            /**
             * Used to render each element.
             * @param {*} tag 
             * @param {*} className 
             * @param {*} data 
             * @param {*} copy 
             * @returns element
             */
            let renderElem = (tag, className, data, copy) => {
                let elem = document.createElement(tag);
                elem.classList.add(className);

                if (tag === 'img' && data !== null) {
                    elem.setAttribute('src', data);
                }
                if (tag === 'a' && data !== null) {
                    elem.setAttribute('href', data);
                }
                if (copy !== null) {
                    elem.innerHTML = copy;
                }

                return elem;
            }

            if (dataItems === undefined || dataItems === {}) {
                return;
            }

            let ul = document.createElement('ul');
            ul.classList.add('list');
            main.outputElem.appendChild(ul);

            // Creates each element for every Title, Description, and Thumbnail.
            for (const key in dataItems) {
                let videoID = dataItems[key]['id']['videoId'];

                let li = document.createElement('li');
                li.setAttribute('data-id', videoID);
                ul.appendChild(li);

                let a = renderElem('a', 'image', `https://www.youtube.com/watch?v=${videoID}`, null);
                li.appendChild(a);

                let img = renderElem('img', 'thumbnail', `${dataItems[key]['snippet']['thumbnails']['high']['url']}`, null);
                img.setAttribute('alt', `${dataItems[key]['snippet']['title']}`);
                a.appendChild(img);

                let div = renderElem('div', 'copy', null, null);
                li.appendChild(div);
                div.appendChild(renderElem('h3', 'title', null, `${dataItems[key]['snippet']['title']}`));
                div.appendChild(renderElem('h4', 'description', null, `${dataItems[key]['snippet']['description']}`));
            }

            main.pagination(data, url);
        }
    };

    $(document).ready(() => {
        main.init();
    });
})();
