import axios from 'axios'
import { $ } from './bling';

function ajaxHeart(e) {
    e.preventDefault();
    console.log('HEART ITTT!!!!!!!!!!!!!!!!!!!');
    console.log(this); //its url we want to his
    axios
        .post(this.action)
        .then(res => {
            // console.log(res.data);
            //this.heart is allow you to acces name="hearth" inside _storeCard.pug
            //and give button element
            const isHearted = this.heart.classList.toggle('heart__button--hearted');
            console.log(isHearted);
            console.log(res.data.hearts);
            $('.heart-count').textContent = res.data.hearts.length;
            if(isHearted){
                this.heart.classList.add('heart__button--float');
                //remove after 2,5s
                setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500);
            }

        })
        .catch(console.error)
}


export default ajaxHeart;