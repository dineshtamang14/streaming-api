const Media = require('../../models/Media');
const AudioRecording = require('../../models/AudioRecording');
const Movie = require('../../models/Movie');

describe('MongoDB media schemas', () => {
  it('defines the media category enum', () => {
    const category = Media.schema.path('category');
    expect(category.enumValues).toEqual(['audio', 'video', 'movie', 'image', 'document']);
  });

  it('requires an AudioRecording media reference', () => {
    const mediaId = AudioRecording.schema.path('mediaId');
    expect(mediaId.isRequired).toBe(true);
  });

  it('defaults an uploaded Media item to audio false for isRecording', () => {
    const media = new Media({
      title: 'Example',
      originalName: 'example.mp3',
      filename: 'example.mp3',
      category: 'audio',
      mimeType: 'audio/mpeg',
      size: 1024,
      url: '/audio/file/example.mp3',
      downloadUrl: '/audio/file/example.mp3?download=1'
    });

    expect(media.isRecording).toBe(false);
  });

  it('requires title and stream URLs for a Movie', () => {
    const title = Movie.schema.path('title');
    const watchUrl = Movie.schema.path('watchUrl');
    const downloadUrl = Movie.schema.path('downloadUrl');
    expect(title.isRequired).toBe(true);
    expect(watchUrl.isRequired).toBe(true);
    expect(downloadUrl.isRequired).toBe(true);
  });
});
