import * as chevre from '@chevre/domain';

import * as uniqid from 'uniqid';

import * as factory from '../factory';

/**
 * イベントリポジトリー
 */
export class MongoRepository extends chevre.repository.Event {
    /**
     * 複数の上映イベントを保管する
     */
    public async saveMultipleScreeningEvent(
        params: factory.event.screeningEvent.IAttributes[]
    ): Promise<factory.event.screeningEvent.IEvent[]> {
        const args = params.map((p) => ({
            _id: uniqid(),
            ...p
        }));
        const docs = await this.eventModel.create(args);

        return docs.map((doc) => doc.toObject());
    }
}
