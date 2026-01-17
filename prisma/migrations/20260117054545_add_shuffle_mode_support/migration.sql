-- AlterTable
ALTER TABLE "items" ADD COLUMN     "handling_type" TEXT NOT NULL DEFAULT 'containerable';

-- CreateTable
CREATE TABLE "item_move_events" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "from_container_id" UUID,
    "to_container_id" UUID,
    "moved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moved_by_user_id" TEXT NOT NULL,

    CONSTRAINT "item_move_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "item_move_events" ADD CONSTRAINT "item_move_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_move_events" ADD CONSTRAINT "item_move_events_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_move_events" ADD CONSTRAINT "item_move_events_from_container_id_fkey" FOREIGN KEY ("from_container_id") REFERENCES "containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_move_events" ADD CONSTRAINT "item_move_events_to_container_id_fkey" FOREIGN KEY ("to_container_id") REFERENCES "containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
