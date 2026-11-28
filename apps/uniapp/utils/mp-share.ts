export default {
  onLoad(this: any) {
    if (!uni.$u) {
      uni.$u = {}
    }
    uni.$u.mpShare = {
      title: '',
      path: '',
      imageUrl: ''
    }
    this.$u.mpShare = uni.$u.mpShare
  },
  onShareAppMessage(this: any) {
    return this.$u.mpShare || uni.$u.mpShare
  }
}
