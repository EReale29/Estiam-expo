import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { parseRoles } from "../utils/validation.js";

function buildTripPayload(row, liked = false, counts = { likes: 0, comments: 0 }) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    destination: row.destination,
    startDate: row.startDate,
    endDate: row.endDate,
    description: row.description,
    image: row.image,
    location: {
      lat: row.location_lat || 0,
      lng: row.location_lng || 0
    },
    created_at: row.created_at,
    owner: {
      id: row.owner_id,
      name: row.owner_name,
      username: row.owner_username,
      avatar: row.owner_avatar,
      roles: parseRoles(row.owner_roles)
    },
    likesCount: counts.likes,
    commentsCount: counts.comments,
    liked
  };
}

function getTripCounts(tripId) {
  const likes = db.prepare("SELECT COUNT(*) AS count FROM likes WHERE trip_id = ?").get(tripId)?.count || 0;
  const comments = db.prepare("SELECT COUNT(*) AS count FROM comments WHERE trip_id = ?").get(tripId)?.count || 0;
  return { likes, comments };
}

export class TripService {
  list({ page, limit, currentUserId }) {
    const offset = (page - 1) * limit;
    const trips = db.prepare(`
      SELECT t.*, u.name as owner_name, u.username as owner_username, u.avatar as owner_avatar, u.roles as owner_roles,
        (SELECT COUNT(*) FROM likes l WHERE l.trip_id = t.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.trip_id = t.id) as comments_count,
        EXISTS(SELECT 1 FROM likes l WHERE l.trip_id = t.id AND l.user_id = @currentUserId) as liked
      FROM trips t
      JOIN users u ON u.id = t.owner_id
      ORDER BY t.created_at DESC
      LIMIT @limit OFFSET @offset
    `).all({ currentUserId, limit, offset });

    const total = db.prepare("SELECT COUNT(*) AS count FROM trips").get().count || 0;
    const payload = trips.map((trip) => buildTripPayload(trip, Boolean(trip.liked), {
      likes: trip.likes_count || 0,
      comments: trip.comments_count || 0
    }));

    return { page, limit, total, trips: payload };
  }

  createTrip({ ownerId, title, destination, startDate, endDate, description, image, location }) {
    const userRow = db.prepare("SELECT id FROM users WHERE id = ?").get(ownerId);
    if (!userRow) return { error: "User not found", status: 404 };

    const createdAt = Date.now();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO trips (id, owner_id, title, destination, startDate, endDate, description, image, location_lat, location_lng, created_at)
      VALUES (@id, @owner_id, @title, @destination, @startDate, @endDate, @description, @image, @location_lat, @location_lng, @created_at)
    `).run({
      id,
      owner_id: ownerId,
      title,
      destination,
      startDate: startDate || null,
      endDate: endDate || null,
      description: description || "",
      image: image || "",
      location_lat: location?.lat ?? null,
      location_lng: location?.lng ?? null,
      created_at: createdAt
    });

    const counts = getTripCounts(id);
    const tripRow = db.prepare(`
      SELECT t.*, u.name as owner_name, u.username as owner_username, u.avatar as owner_avatar, u.roles as owner_roles
      FROM trips t
      JOIN users u ON u.id = t.owner_id
      WHERE t.id = ?
    `).get(id);

    return { trip: buildTripPayload(tripRow, false, counts), status: 201 };
  }

  getTrip(id, currentUserId) {
    const tripRow = db.prepare(`
      SELECT t.*, u.name as owner_name, u.username as owner_username, u.avatar as owner_avatar, u.roles as owner_roles
      FROM trips t
      JOIN users u ON u.id = t.owner_id
      WHERE t.id = ?
    `).get(id);
    if (!tripRow) return null;

    const counts = getTripCounts(id);
    const liked = Boolean(db.prepare("SELECT 1 FROM likes WHERE trip_id = ? AND user_id = ?").get(id, currentUserId));

    const comments = db.prepare(`
      SELECT c.id, c.text, c.created_at, u.id as user_id, u.name as user_name, u.username as user_username, u.avatar as user_avatar
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.trip_id = ?
      ORDER BY c.created_at ASC
    `).all(id).map((comment) => ({
      id: comment.id,
      text: comment.text,
      created_at: comment.created_at,
      user: {
        id: comment.user_id,
        name: comment.user_name,
        username: comment.user_username,
        avatar: comment.user_avatar
      }
    }));

    const tripPayload = buildTripPayload(tripRow, liked, counts);
    return { ...tripPayload, comments };
  }

  updateTrip(id, ownerId, data) {
    const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(id);
    if (!trip) return { error: "Trip not found", status: 404 };
    if (trip.owner_id !== ownerId) return { error: "Only the owner can update this trip", status: 403 };

    const { title, destination, startDate, endDate, description, image, location } = data || {};

    db.prepare(`
      UPDATE trips SET
        title = COALESCE(@title, title),
        destination = COALESCE(@destination, destination),
        startDate = COALESCE(@startDate, startDate),
        endDate = COALESCE(@endDate, endDate),
        description = COALESCE(@description, description),
        image = COALESCE(@image, image),
        location_lat = COALESCE(@location_lat, location_lat),
        location_lng = COALESCE(@location_lng, location_lng)
      WHERE id = @id
    `).run({
      id,
      title,
      destination,
      startDate,
      endDate,
      description,
      image,
      location_lat: location?.lat,
      location_lng: location?.lng
    });

    const counts = getTripCounts(id);
    const tripRow = db.prepare(`
      SELECT t.*, u.name as owner_name, u.username as owner_username, u.avatar as owner_avatar, u.roles as owner_roles
      FROM trips t
      JOIN users u ON u.id = t.owner_id
      WHERE t.id = ?
    `).get(id);

    const liked = Boolean(db.prepare("SELECT 1 FROM likes WHERE trip_id = ? AND user_id = ?").get(id, ownerId));
    return { trip: buildTripPayload(tripRow, liked, counts), status: 200 };
  }

  deleteTrip(id, ownerId) {
    const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(id);
    if (!trip) return { error: "Trip not found", status: 404 };
    if (trip.owner_id !== ownerId) return { error: "Only the owner can delete this trip", status: 403 };

    db.prepare("DELETE FROM trips WHERE id = ?").run(id);
    return { message: "Trip deleted", status: 200 };
  }

  toggleLike(tripId, userId) {
    const trip = db.prepare("SELECT id FROM trips WHERE id = ?").get(tripId);
    if (!trip) return { error: "Trip not found", status: 404 };

    const toggle = db.transaction(() => {
      const existing = db.prepare("SELECT 1 FROM likes WHERE trip_id = ? AND user_id = ?").get(tripId, userId);
      if (existing) {
        db.prepare("DELETE FROM likes WHERE trip_id = ? AND user_id = ?").run(tripId, userId);
        return false;
      }
      db.prepare("INSERT INTO likes (trip_id, user_id, created_at) VALUES (?, ?, ?)").run(tripId, userId, Date.now());
      return true;
    });

    const liked = toggle();
    const likesCount = db.prepare("SELECT COUNT(*) AS count FROM likes WHERE trip_id = ?").get(tripId).count || 0;
    return { liked, likesCount, status: 200 };
  }

  addComment(tripId, userId, text) {
    if (!text || !text.trim()) return { error: "Comment text is required", status: 400 };

    const trip = db.prepare("SELECT id FROM trips WHERE id = ?").get(tripId);
    if (!trip) return { error: "Trip not found", status: 404 };
    const userRow = db.prepare("SELECT id, name, username, avatar FROM users WHERE id = ?").get(userId);
    if (!userRow) return { error: "User not found", status: 404 };

    const commentId = uuidv4();
    const createdAt = Date.now();
    db.prepare("INSERT INTO comments (id, trip_id, user_id, text, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(commentId, tripId, userId, text, createdAt);

    return { id: commentId, text, created_at: createdAt, user: userRow, status: 201 };
  }

  deleteComment(tripId, commentId, requesterId) {
    const comment = db.prepare("SELECT * FROM comments WHERE id = ? AND trip_id = ?").get(commentId, tripId);
    if (!comment) return { error: "Comment not found", status: 404 };

    const trip = db.prepare("SELECT owner_id FROM trips WHERE id = ?").get(tripId);
    if (!trip) return { error: "Trip not found", status: 404 };

    if (comment.user_id !== requesterId && trip.owner_id !== requesterId) {
      return { error: "Not allowed to delete this comment", status: 403 };
    }

    db.prepare("DELETE FROM comments WHERE id = ?").run(commentId);
    return { message: "Comment deleted", status: 200 };
  }

  dashboard() {
    const now = Date.now();
    const totalTrips = db.prepare("SELECT COUNT(*) AS count FROM trips").get().count || 0;
    const totalLikes = db.prepare("SELECT COUNT(*) AS count FROM likes").get().count || 0;
    const totalComments = db.prepare("SELECT COUNT(*) AS count FROM comments").get().count || 0;

    const trips = db.prepare(`
      SELECT t.*, u.name as owner_name, u.username as owner_username, u.avatar as owner_avatar, u.roles as owner_roles
      FROM trips t
      JOIN users u ON u.id = t.owner_id
      ORDER BY t.created_at DESC
    `).all();

    const upcomingTrips = trips
      .filter((trip) => {
        if (!trip.startDate) return false;
        const start = new Date(trip.startDate).getTime();
        return !Number.isNaN(start) && start >= now;
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5)
      .map((trip) => buildTripPayload(trip));

    const activities = trips.slice(0, 10).map((trip) => ({
      id: trip.id,
      text: `Mise à jour de "${trip.title || "Voyage"}"`,
      time: trip.endDate || trip.startDate || "",
      icon: "airplane-outline"
    }));

    return {
      stats: {
        trips: totalTrips,
        likes: totalLikes,
        comments: totalComments
      },
      upcomingTrips,
      activities
    };
  }
}
