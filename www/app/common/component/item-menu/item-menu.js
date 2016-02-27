/**
 * Created by kevin on 05/12/2015 for Podcast Server
 */
import {Component, View, Module} from '../../../decorators';
import DownloadManager from '../../service/data/downloadManager';
import playlistService from '../../service/playlistService';
import ItemServiceModule from '../../service/data/itemService';
import Copy from '../copy/copy';
import WatchlistChooser from '../watchlist-chooser/watchlist-chooser';
import template from './item-menu.html!text';
import './item-menu.css!';

@Module({
    name : 'ps.common.component.item-menu',
    modules : [ DownloadManager, playlistService, Copy, WatchlistChooser, ItemServiceModule ]
})
@Component({
    selector : 'item-menu',
    as : 'imc',
    bindToController : {
        item : '=',
        localRead : '=',
        onLineRead : '=',
        downloadControl : '=',
        readInPlayer : '=',
        playlistControl : '=',
        watchlistControl : '=',
        deleteItem : '=',
        onDeleteItem : '&',
        resetItem : '='
    }
})
@View({
    template : template
})
export default class ItemMenuComponent {

    constructor(DonwloadManager, playlistService, $uibModal, WatchListService, itemService) {
        "ngInject";
        this.watchListService = WatchListService;
        this.DownloadManager = DonwloadManager;
        this.playlistService = playlistService;
        this.$uibModal = $uibModal;
        this.itemService = itemService;
    }

    play(item) {
        return this.itemService.play(item);
    }

    remove(item) {
        return item.remove()
            .then(() => this.playlistService.remove(item))
            .then(() => this.onDeleteItem());
    }

    reset(item) {
        return item.reset()
            .then((itemReseted) => Object.assign(item, itemReseted))
            .then((itemInList) => this.playlistService.remove(itemInList));
    }

    stopDownload(item) {
        this.DownloadManager.ws.stop(item);
    }

    toggleDownload(item){
        return this.DownloadManager.ws.toggle(item);
    }

    addOrRemove(item) {
        return this.playlistService.addOrRemove(item);
    }

    isInPlaylist(item) {
        return this.playlistService.contains(item);
    }

    addToWatchList() {
        return this.$uibModal
            .open(WatchlistChooser.$UibModalConf.withResolve({
                item : () => this.item,
                watchListsOfItem : WatchListService => {"ngInject"; return WatchListService.findAllWithItem(this.item);}
            }));
    }

    hasToBeVisible(elem) {
        if (this[elem] === true) return true;

        if (elem === 'playlistControl') {
            return ItemServiceModule.isAudio(this.item) && !this.playlistService.isEmpty();
        }

        if (elem === 'watchlistControl') {
            return ItemServiceModule.isVideo(this.item);
        }

        return false;
    }
}
